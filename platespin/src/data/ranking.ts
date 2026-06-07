import type { DietId, PlaceResult } from "../contract/types";
import { isDietCompliant } from "./osm";

// Ranking. OSM almost never has ratings/prices, so in practice this is:
//   diet-compliance > data completeness > proximity.
// When ratings DO exist (rare, or via Phase 8 enrichment) we use a Bayesian-ish
// score = rating * log(1 + ratingCount) as the primary signal.

const QUALITY_WEIGHT: Record<PlaceResult["dataQuality"], number> = {
  rich: 2,
  basic: 1,
  sparse: 0,
};

function ratingScore(p: PlaceResult): number {
  if (typeof p.rating !== "number") return 0;
  return p.rating * Math.log1p(p.ratingCount ?? 0);
}

export function rankPlaces(places: PlaceResult[], diets: DietId[] = []): PlaceResult[] {
  return [...places].sort((a, b) => {
    // Explicitly-compliant diet tags float to the top (when diets are set).
    if (diets.length) {
      const ca = isDietCompliant(a, diets, "only") ? 1 : 0;
      const cb = isDietCompliant(b, diets, "only") ? 1 : 0;
      if (ca !== cb) return cb - ca;
    }
    const ra = ratingScore(a);
    const rb = ratingScore(b);
    if (ra !== rb) return rb - ra;
    const qa = QUALITY_WEIGHT[a.dataQuality];
    const qb = QUALITY_WEIGHT[b.dataQuality];
    if (qa !== qb) return qb - qa;
    return (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity);
  });
}

/** Count compliant places per cuisine — powers the honest wheel's AvailabilityMap. */
export function countByCuisine(places: PlaceResult[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of places) {
    for (const c of p.cuisine) counts[c] = (counts[c] ?? 0) + 1;
  }
  return counts;
}
