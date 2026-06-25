export type Badge = {
  name: string;
  label: string;
  description: string;
  earned: boolean;
  unlockedAt?: string;
};

export type Milestone = {
  day: string;
  title: string;
  description: string;
  status: "complete" | "current" | "upcoming";
};

export const challengeSummary = {
  title: "Stellar Savings Challenge",
  subtitle:
    "Build a consistent XLM habit with streak-based rewards, milestone badges, and a clear savings runway.",
  goalLabel: "Challenge goal",
  goalAmount: 500,
  savedAmount: 320,
  streakDays: 12,
  weeklyTarget: 40,
  nextReward: "14-day streak badge",
  completionEstimate: "18 days left",
};

export const challenge = {
  name: challengeSummary.title,
  tagline: challengeSummary.subtitle,
  weeklyTarget: challengeSummary.weeklyTarget,
  streakWeeks: challengeSummary.streakDays,
  bestStreak: 18,
};

export const badges: Badge[] = [
  {
    name: "First Spark",
    label: "Earned",
    description: "Funded the challenge wallet for the first time.",
    earned: true,
    unlockedAt: "Day 1",
  },
  {
    name: "Week One",
    label: "Earned",
    description: "Kept the savings streak alive for 7 straight days.",
    earned: true,
    unlockedAt: "Day 7",
  },
  {
    name: "Momentum",
    label: "Unlocked soon",
    description: "Hit the 14-day streak and compounded two weekly deposits.",
    earned: false,
    unlockedAt: "Day 14",
  },
  {
    name: "Moon Saver",
    label: "Locked",
    description: "Reach 30 days of uninterrupted challenge activity.",
    earned: false,
    unlockedAt: "Day 30",
  },
];

export const milestones: Milestone[] = [
  {
    day: "Day 1",
    title: "Wallet funded",
    description: "Challenge balance seeded and ready for streak tracking.",
    status: "complete",
  },
  {
    day: "Day 7",
    title: "Weekly consistency",
    description: "First reward checkpoint cleared with a full week of activity.",
    status: "complete",
  },
  {
    day: "Day 12",
    title: "Mid-challenge review",
    description: "Current streak is on track and the savings curve is climbing.",
    status: "current",
  },
  {
    day: "Day 21",
    title: "Challenge finale",
    description: "Final deposit, badge reveal, and reward unlock.",
    status: "upcoming",
  },
];

export const progressBreakdown = [
  { label: "Saved this week", value: "14 XLM" },
  { label: "Auto-roundups", value: "7 deposits" },
  { label: "Pending goal", value: "180 XLM" },
];
