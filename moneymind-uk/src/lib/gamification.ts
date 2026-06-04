import { XP_REWARDS } from "./storage";
import type { ModuleId, ProgressState, Tier } from "./types";
import { modules, modulesByTier } from "../content/modules";
import { GRADUATE_RANK, TIERS } from "../content/tiers";

// ---------------------------------------------------------------------------
// XP titles (secondary progression — the hero metric is "Money Found", and the
// primary status is the per-tier rank below). Kept for the XP bar display.
// ---------------------------------------------------------------------------
const LEVELS = [
  { minXp: 0, title: "Newcomer" },
  { minXp: 200, title: "Learner" },
  { minXp: 600, title: "Money Aware" },
  { minXp: 1200, title: "Budget Savvy" },
  { minXp: 2200, title: "Finance Smart" },
  { minXp: 3500, title: "MoneyMind Pro" },
  { minXp: 5000, title: "UK Finance Expert" },
] as const;

export function getLevelInfo(xp: number): { level: number; title: string; nextLevelXp: number | null } {
  let level = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXp) level = i;
  }
  const title = LEVELS[level].title;
  const nextLevelXp = level < LEVELS.length - 1 ? LEVELS[level + 1].minXp : null;
  return { level, title, nextLevelXp };
}

export function getLevelProgress(xp: number): number {
  const { level, nextLevelXp } = getLevelInfo(xp);
  if (nextLevelXp === null) return 100;
  const currentLevelXp = LEVELS[level].minXp;
  return Math.round(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100);
}

// ---------------------------------------------------------------------------
// Module status. Completion = lesson + quiz (tool is optional bonus XP, and 11
// of 23 modules have no tool at all).
// ---------------------------------------------------------------------------
export type ModuleStatus = "not-started" | "in-progress" | "complete";

export function getModuleStatus(id: ModuleId, progress: ProgressState): ModuleStatus {
  const hasLesson = progress.completedLessons.includes(id);
  const hasQuiz = progress.quizScores[id] !== undefined;
  const hasTool = progress.toolsUsed.includes(id);
  if (hasLesson && hasQuiz) return "complete";
  if (hasLesson || hasQuiz || hasTool) return "in-progress";
  return "not-started";
}

export function isModuleComplete(id: ModuleId, progress: ProgressState): boolean {
  return getModuleStatus(id, progress) === "complete";
}

// ---------------------------------------------------------------------------
// Tiers: unlocking, completion and ranks.
// ---------------------------------------------------------------------------

// Tier 1 is always open. Each later tier unlocks once EVERY module in the
// previous tier is complete (gated by modules, not raw XP).
export function isTierUnlocked(tier: Tier, progress: ProgressState): boolean {
  if (tier <= 1) return true;
  const prev = modulesByTier((tier - 1) as Tier);
  return prev.every((m) => isModuleComplete(m.id, progress));
}

// Fraction (0–100) of a tier's modules that are complete.
export function tierProgress(tier: Tier, progress: ProgressState): number {
  const mods = modulesByTier(tier);
  if (mods.length === 0) return 0;
  const done = mods.filter((m) => isModuleComplete(m.id, progress)).length;
  return Math.round((done / mods.length) * 100);
}

export function isTierComplete(tier: Tier, progress: ProgressState): boolean {
  const mods = modulesByTier(tier);
  return mods.length > 0 && mods.every((m) => isModuleComplete(m.id, progress));
}

// The user's current rank: the rank of the highest fully-completed tier, or
// "Graduate" once every module is done. "Newcomer" before any tier is cleared.
export function currentRank(progress: ProgressState): string {
  if (isGraduate(progress)) return GRADUATE_RANK;
  let rank = "Newcomer";
  for (const t of TIERS) {
    if (isTierComplete(t.tier, progress)) rank = t.rank;
  }
  return rank;
}

// ---------------------------------------------------------------------------
// Graduation + headline totals.
// ---------------------------------------------------------------------------
export const GRADUATE_BADGE_ID = "graduate";
export const FIRST_STEPS_BADGE_ID = "first-steps";

export function isGraduate(progress: ProgressState): boolean {
  return modules.every((m) => isModuleComplete(m.id, progress));
}

// Total XP theoretically available across all modules + quests (for display).
export function totalPossibleXp(): number {
  return modules.reduce((sum, m) => {
    const toolXp = m.tool ? XP_REWARDS.tool : 0;
    return (
      sum +
      XP_REWARDS.lesson +
      XP_REWARDS.quiz +
      XP_REWARDS.moduleComplete +
      toolXp +
      XP_REWARDS.quest
    );
  }, 0);
}

// Overall completion as a percentage of completed modules (lesson + quiz).
export function overallProgress(progress: ProgressState): number {
  const done = modules.filter((m) => isModuleComplete(m.id, progress)).length;
  return Math.round((done / modules.length) * 100);
}

export function completedModuleCount(progress: ProgressState): number {
  return modules.filter((m) => isModuleComplete(m.id, progress)).length;
}
