import type { CourseModule, ModuleId, Tier } from "../lib/types";
import { tier1Modules } from "./modules/tier1";
import { tier2Modules } from "./modules/tier2";
import { tier3Modules } from "./modules/tier3";
import { tier4Modules } from "./modules/tier4";

// Pure data — NO React/DOM imports. Bundled into a Cloudflare Worker.
// The 23 modules (M0–M22) live in four per-tier files and are concatenated
// here in canonical PLAY order (Tier 1 → 4). Every figure is verified for the
// 2026/27 UK tax year and mirrors UK_FIGURES in ./constants.

// `modules` is ordered exactly as the journey is played, tier by tier.
export const modules: CourseModule[] = [
  ...tier1Modules,
  ...tier2Modules,
  ...tier3Modules,
  ...tier4Modules,
];

// ── Helper lookups (keep components from re-deriving these everywhere) ──────

// All module ids in play order.
export const MODULE_IDS: ModuleId[] = modules.map((m) => m.id);

// id → module.
const byId = new Map<ModuleId, CourseModule>(modules.map((m) => [m.id, m]));
export function getModule(id: ModuleId): CourseModule | undefined {
  return byId.get(id);
}

// slug → module.
const bySlug = new Map<string, CourseModule>(modules.map((m) => [m.slug, m]));
export function getModuleBySlug(slug: string): CourseModule | undefined {
  return bySlug.get(slug);
}

// Modules grouped by tier, each preserving play order.
export function modulesByTier(tier: Tier): CourseModule[] {
  return modules.filter((m) => m.tier === tier);
}

// The next module to play after `id`, following play order across tiers.
export function nextModule(id: ModuleId): CourseModule | undefined {
  const index = modules.findIndex((m) => m.id === id);
  if (index === -1 || index === modules.length - 1) return undefined;
  return modules[index + 1];
}
