// Badge registry beyond the 23 per-module badges (those live on each module).
// Three tiers per the curriculum: module · achievement · meta. Pure data.
import { modules } from "./modules";

export interface BadgeDef {
  id: string;
  label: string;
  description: string;
}

// Achievement badges — unlocked by real-world quests / specific actions.
export const ACHIEVEMENT_BADGES: BadgeDef[] = [
  { id: "switcher", label: "Switcher", description: "Switched a bill or bank account to a better deal." },
  { id: "code-cracker", label: "Code Cracker", description: "Checked your tax code against your payslip." },
  { id: "credit-aware", label: "Credit Aware", description: "Checked your credit report and debt position." },
  { id: "pension-detective", label: "Pension Detective", description: "Checked your State Pension forecast." },
];

// Meta badges — milestones across the whole journey.
export const META_BADGES: BadgeDef[] = [
  { id: "money-100", label: "Money Found £100", description: "Unlocked £100+ through quests." },
  { id: "money-500", label: "Money Found £500", description: "Unlocked £500+ through quests." },
  { id: "money-1000", label: "Money Found £1,000+", description: "Unlocked £1,000+ through quests." },
  { id: "graduate", label: "MoneyMind Graduate", description: "Completed every module across all four tiers." },
];

// The "first action" badge is also Module 0's badge id ("first-steps").
export const FIRST_STEPS_BADGE: BadgeDef = {
  id: "first-steps",
  label: "First Steps",
  description: "Set your first money goal and learned the order of operations.",
};

// Money-found thresholds → meta badge ids that should be earned at that point.
export function moneyFoundBadgeIds(moneyFound: number): string[] {
  const ids: string[] = [];
  if (moneyFound >= 100) ids.push("money-100");
  if (moneyFound >= 500) ids.push("money-500");
  if (moneyFound >= 1000) ids.push("money-1000");
  return ids;
}

// Every badge the app can display, grouped and de-duplicated by id. Module
// badges come first (in play order), then achievement, then meta. "first-steps"
// is Module 0's badge, so it is naturally included by the module pass.
export interface BadgeGroup {
  title: string;
  badges: BadgeDef[];
}

export function badgeGroups(): BadgeGroup[] {
  const moduleIds = new Set(modules.map((m) => m.badge.id));
  return [
    {
      title: "Module badges",
      badges: modules.map((m) => ({
        id: m.badge.id,
        label: m.badge.label,
        description: m.badge.description,
      })),
    },
    {
      title: "Achievement badges",
      badges: ACHIEVEMENT_BADGES.filter((b) => !moduleIds.has(b.id)),
    },
    {
      title: "Meta badges",
      badges: META_BADGES.filter((b) => !moduleIds.has(b.id)),
    },
  ];
}
