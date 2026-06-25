import { Address, nativeToScVal } from "@stellar/stellar-sdk";

import { readContract } from "./client";

export type ChallengeConfig = {
  admin: string;
  name: string;
  weekly_target: string;
  duration_weeks: number;
};

export type SavingsSummary = {
  committed_weekly: string;
  total_saved: string;
  current_streak: number;
  best_streak: number;
  badge_count: number;
  next_badge_at: string;
};

export const savingsContract = {
  async getConfig(): Promise<ChallengeConfig> {
    return readContract<ChallengeConfig>("get_config");
  },
  async getSummary(participant: string): Promise<SavingsSummary> {
    return readContract<SavingsSummary>("get_summary", [
      new Address(participant).toScVal(),
    ]);
  },
  async previewJoinTarget(amount: string): Promise<string> {
    return nativeToScVal(BigInt(amount), { type: "i128" }).toXDR("base64");
  },
};
