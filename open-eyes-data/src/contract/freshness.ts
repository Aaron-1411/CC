/**
 * Shared Contract — Data freshness.
 *
 * Replaces the dishonest generic "LIVE" badge. Every data widget reports how
 * fresh its data actually is, derived from the real retrieval/source state —
 * never a static label, never silently stale.
 */

import type { SourceId } from "./sources";

export type FreshnessStatus = "fresh" | "stale" | "source_down";

export interface FreshnessMeta {
  sourceId: SourceId;
  /** ISO timestamp the underlying data was actually retrieved (NOT envelope-build time). */
  fetchedAt: string;
  status: FreshnessStatus;
  /** For scheduled releases, when the next official update is due. */
  nextExpected?: string;
  /** When status === "source_down": the last time good data was obtained. */
  lastGoodAt?: string;
}

/**
 * Classify freshness from the real retrieval time and the source's cadence.
 * `maxAgeMs` is how old data may be before we call it "stale" for that source.
 */
export function classifyFreshness(
  sourceId: SourceId,
  fetchedAt: string,
  maxAgeMs: number,
  opts?: { sourceDown?: boolean; lastGoodAt?: string; nextExpected?: string },
): FreshnessMeta {
  if (opts?.sourceDown) {
    return {
      sourceId,
      fetchedAt,
      status: "source_down",
      lastGoodAt: opts.lastGoodAt,
      nextExpected: opts.nextExpected,
    };
  }
  const ageMs = Date.now() - new Date(fetchedAt).getTime();
  return {
    sourceId,
    fetchedAt,
    status: ageMs > maxAgeMs ? "stale" : "fresh",
    nextExpected: opts?.nextExpected,
  };
}
