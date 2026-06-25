#![no_std]

mod errors;
mod state;

use errors::SavingsError;
use soroban_sdk::{Address, Env, String, contract, contractimpl, symbol_short};
use state::{ChallengeConfig, DataKey, ParticipantState, Summary};

#[contract]
pub struct StellarStreaksContract;

fn config(env: &Env) -> Result<ChallengeConfig, SavingsError> {
    env.storage()
        .instance()
        .get(&DataKey::Config)
        .ok_or(SavingsError::NotInitialized)
}

fn participant_key(participant: &Address) -> DataKey {
    DataKey::Participant(participant.clone())
}

fn badge_thresholds(total_saved: i128, weekly_target: i128) -> u32 {
    if weekly_target <= 0 {
        return 0;
    }

    let milestones = [
        weekly_target,
        weekly_target * 4,
        weekly_target * 8,
        weekly_target * 12,
    ];

    milestones.iter().filter(|threshold| total_saved >= **threshold).count() as u32
}

fn next_badge_at(total_saved: i128, weekly_target: i128) -> i128 {
    if weekly_target <= 0 {
        return 0;
    }

    let milestones = [
        weekly_target,
        weekly_target * 4,
        weekly_target * 8,
        weekly_target * 12,
    ];

    milestones
        .into_iter()
        .find(|threshold| total_saved < *threshold)
        .unwrap_or(weekly_target * 12)
}

#[contractimpl]
impl StellarStreaksContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        weekly_target: i128,
        duration_weeks: u32,
    ) -> Result<(), SavingsError> {
        admin.require_auth();

        if env.storage().instance().has(&DataKey::Config) {
            return Err(SavingsError::AlreadyInitialized);
        }

        if weekly_target <= 0 || duration_weeks == 0 {
            return Err(SavingsError::InvalidTarget);
        }

        let config = ChallengeConfig {
            admin,
            name,
            weekly_target,
            duration_weeks,
        };

        env.storage().instance().set(&DataKey::Config, &config);
        env.events()
            .publish((symbol_short!("init"),), config.duration_weeks);
        Ok(())
    }

    pub fn join(env: Env, participant: Address, committed_weekly: i128) -> Result<(), SavingsError> {
        participant.require_auth();
        let challenge = config(&env)?;

        if committed_weekly < challenge.weekly_target {
            return Err(SavingsError::InvalidTarget);
        }

        if env.storage().instance().has(&participant_key(&participant)) {
            return Err(SavingsError::AlreadyJoined);
        }

        let state = ParticipantState {
            committed_weekly,
            total_saved: 0,
            current_streak: 0,
            best_streak: 0,
            last_week: 0,
            badge_count: 0,
        };

        env.storage()
            .instance()
            .set(&participant_key(&participant), &state);
        env.events()
            .publish((symbol_short!("join"), participant.clone()), committed_weekly);
        Ok(())
    }

    pub fn record_savings(
        env: Env,
        participant: Address,
        amount: i128,
        week_number: u32,
    ) -> Result<Summary, SavingsError> {
        participant.require_auth();
        let challenge = config(&env)?;

        if amount <= 0 {
            return Err(SavingsError::InvalidAmount);
        }

        let key = participant_key(&participant);
        let mut state: ParticipantState = env
            .storage()
            .instance()
            .get(&key)
            .ok_or(SavingsError::ParticipantNotJoined)?;

        if week_number <= state.last_week {
            return Err(SavingsError::InvalidWeekOrder);
        }

        state.total_saved += amount;
        state.last_week = week_number;

        if amount >= state.committed_weekly {
            state.current_streak += 1;
            if state.current_streak > state.best_streak {
                state.best_streak = state.current_streak;
            }
        } else {
            state.current_streak = 0;
        }

        state.badge_count = badge_thresholds(state.total_saved, challenge.weekly_target);

        env.storage().instance().set(&key, &state);
        env.events()
            .publish((symbol_short!("save"), participant.clone()), amount);

        Ok(Summary {
            committed_weekly: state.committed_weekly,
            total_saved: state.total_saved,
            current_streak: state.current_streak,
            best_streak: state.best_streak,
            badge_count: state.badge_count,
            next_badge_at: next_badge_at(state.total_saved, challenge.weekly_target),
        })
    }

    pub fn get_config(env: Env) -> Result<ChallengeConfig, SavingsError> {
        config(&env)
    }

    pub fn get_summary(env: Env, participant: Address) -> Result<Summary, SavingsError> {
        let challenge = config(&env)?;
        let state: ParticipantState = env
            .storage()
            .instance()
            .get(&participant_key(&participant))
            .ok_or(SavingsError::ParticipantNotJoined)?;

        Ok(Summary {
            committed_weekly: state.committed_weekly,
            total_saved: state.total_saved,
            current_streak: state.current_streak,
            best_streak: state.best_streak,
            badge_count: state.badge_count,
            next_badge_at: next_badge_at(state.total_saved, challenge.weekly_target),
        })
    }
}

#[cfg(test)]
mod test;
