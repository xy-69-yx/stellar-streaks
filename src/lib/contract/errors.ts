export const ContractErrorCode = {
  AlreadyInitialized: 1,
  NotInitialized: 2,
  NotAdmin: 3,
  AlreadyJoined: 4,
  ParticipantNotJoined: 5,
  InvalidTarget: 6,
  InvalidAmount: 7,
  InvalidWeekOrder: 8,
} as const;

const messages: Record<number, string> = {
  [ContractErrorCode.AlreadyInitialized]:
    "The savings challenge is already initialized.",
  [ContractErrorCode.NotInitialized]:
    "The savings challenge is not initialized yet.",
  [ContractErrorCode.NotAdmin]:
    "Only the contract admin can perform that action.",
  [ContractErrorCode.AlreadyJoined]:
    "This wallet already joined the savings challenge.",
  [ContractErrorCode.ParticipantNotJoined]:
    "Join the challenge before recording savings.",
  [ContractErrorCode.InvalidTarget]:
    "The committed amount is below the weekly target.",
  [ContractErrorCode.InvalidAmount]:
    "Savings amount must be greater than zero.",
  [ContractErrorCode.InvalidWeekOrder]:
    "Week number must move forward each time you record savings.",
};

export function describeContractError(code: number | null | undefined) {
  if (code == null) return "Unknown contract error.";
  return messages[code] ?? `Contract error #${code}.`;
}
