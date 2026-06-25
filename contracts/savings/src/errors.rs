use soroban_sdk::contracterror;

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum SavingsError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAdmin = 3,
    AlreadyJoined = 4,
    ParticipantNotJoined = 5,
    InvalidTarget = 6,
    InvalidAmount = 7,
    InvalidWeekOrder = 8,
}
