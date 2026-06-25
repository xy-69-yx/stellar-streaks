use soroban_sdk::{Address, contracttype, String};

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct ChallengeConfig {
    pub admin: Address,
    pub name: String,
    pub weekly_target: i128,
    pub duration_weeks: u32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct ParticipantState {
    pub committed_weekly: i128,
    pub total_saved: i128,
    pub current_streak: u32,
    pub best_streak: u32,
    pub last_week: u32,
    pub badge_count: u32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum DataKey {
    Config,
    Participant(Address),
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Summary {
    pub committed_weekly: i128,
    pub total_saved: i128,
    pub current_streak: u32,
    pub best_streak: u32,
    pub badge_count: u32,
    pub next_badge_at: i128,
}
