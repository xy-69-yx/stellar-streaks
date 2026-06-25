use super::*;
use crate::errors::SavingsError;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn contract_err<T, E>(
    r: Result<Result<T, E>, Result<SavingsError, soroban_sdk::InvokeError>>,
) -> SavingsError {
    r.err().expect("expected contract call to fail").unwrap()
}

#[test]
fn initialize_and_join_flow() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, StellarStreaksContract);
    let client = StellarStreaksContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let participant = Address::generate(&env);

    client
        .try_initialize(&admin, &String::from_str(&env, "Stellar Streaks"), &5, &12)
        .unwrap()
        .unwrap();
    client.try_join(&participant, &5).unwrap().unwrap();

    let summary = client.get_summary(&participant);
    assert_eq!(summary.committed_weekly, 5);
    assert_eq!(summary.total_saved, 0);
    assert_eq!(summary.current_streak, 0);
    assert_eq!(summary.badge_count, 0);
}

#[test]
fn record_savings_updates_streaks_and_badges() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, StellarStreaksContract);
    let client = StellarStreaksContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let participant = Address::generate(&env);

    client
        .try_initialize(&admin, &String::from_str(&env, "Stellar Streaks"), &5, &12)
        .unwrap()
        .unwrap();
    client.try_join(&participant, &5).unwrap().unwrap();

    let summary = client.record_savings(&participant, &5, &1);
    assert_eq!(summary.total_saved, 5);
    assert_eq!(summary.current_streak, 1);
    assert_eq!(summary.best_streak, 1);
    assert_eq!(summary.badge_count, 1);

    let summary = client.record_savings(&participant, &10, &2);
    assert_eq!(summary.total_saved, 15);
    assert_eq!(summary.current_streak, 2);
    assert_eq!(summary.best_streak, 2);
    assert_eq!(summary.badge_count, 1);
}

#[test]
fn record_savings_rejects_old_weeks() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, StellarStreaksContract);
    let client = StellarStreaksContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let participant = Address::generate(&env);

    client
        .try_initialize(&admin, &String::from_str(&env, "Stellar Streaks"), &5, &12)
        .unwrap()
        .unwrap();
    client.try_join(&participant, &5).unwrap().unwrap();

    client.record_savings(&participant, &5, &3);

    let err = contract_err(client.try_record_savings(&participant, &5, &3));
    assert_eq!(err, SavingsError::InvalidWeekOrder);
}
