import type { AvailabilityMap, CuisineId } from "@/contract/types";

// Pure spin logic — no React, easy to test.
//
// THE HONEST WHEEL:
//  - Slices are drawn equal (visually fair), but selection is WEIGHTED.
//  - Availability weighting: cuisines with more in-range, diet-compliant results
//    are more likely; cuisines with ZERO results are excluded (never spin to a
//    dead end). When availability is unknown (Phase 2, no API), every selected
//    cuisine is treated as available.
//  - Soft anti-repeat: recently-landed cuisines are down-weighted (not excluded)
//    so the wheel stays honest but doesn't serve the same answer twice in a row.

const ANTI_REPEAT_FACTOR = 0.25;

export interface WheelSlice {
  id: CuisineId;
  available: boolean; // false → greyed out, never selected
  count?: number; // results in range, if known
}

/**
 * Decide which cuisines appear on the wheel and whether each is selectable.
 * Excludes cuisines with a known count of 0. Keeps unknowns selectable.
 */
export function buildSlices(
  selected: CuisineId[],
  availability?: AvailabilityMap,
): WheelSlice[] {
  return selected.map((id) => {
    const count = availability?.[id];
    return {
      id,
      count,
      available: count === undefined ? true : count > 0,
    };
  });
}

function weightFor(
  slice: WheelSlice,
  recentResults: CuisineId[],
): number {
  if (!slice.available) return 0;
  // Base weight scales gently with availability (log so a 40-result cuisine
  // doesn't dwarf a 2-result one). Unknown counts get a neutral base of 1.
  const base = slice.count === undefined ? 1 : 1 + Math.log1p(slice.count);
  const recentRank = recentResults.indexOf(slice.id);
  const penalty = recentRank === -1 ? 1 : ANTI_REPEAT_FACTOR * (recentRank + 1) / recentResults.length;
  return base * penalty;
}

/** Pick a target cuisine index (into `slices`) using weighted random selection. */
export function pickTargetIndex(
  slices: WheelSlice[],
  recentResults: CuisineId[],
  rng: () => number = Math.random,
): number {
  const weights = slices.map((s) => weightFor(s, recentResults));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) {
    // Everything excluded (all counts 0) — fall back to first available, else 0.
    const idx = slices.findIndex((s) => s.available);
    return idx === -1 ? 0 : idx;
  }
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

export interface SpinTarget {
  index: number;
  /** Absolute rotation (deg) to apply to the wheel so the chosen slice lands under the top pointer. */
  rotation: number;
}

/**
 * Compute the final rotation. Pointer is at the top (12 o'clock). Slices are laid
 * out clockwise starting from the top. We always rotate forward (clockwise) by at
 * least `fullSpins` turns plus a small jitter inside the slice for a natural feel.
 */
export function computeSpin(
  index: number,
  sliceCount: number,
  currentRotation: number,
  fullSpins = 5,
  rng: () => number = Math.random,
): SpinTarget {
  const sliceAngle = 360 / sliceCount;
  // Jitter within the middle 60% of the slice so the pointer never sits on a border.
  const jitter = (rng() - 0.5) * sliceAngle * 0.6;
  const centerAngle = index * sliceAngle + sliceAngle / 2 + jitter;
  const targetMod = (360 - (centerAngle % 360)) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let delta = targetMod - currentMod;
  if (delta < 0) delta += 360;
  const rotation = currentRotation + fullSpins * 360 + delta;
  return { index, rotation };
}
