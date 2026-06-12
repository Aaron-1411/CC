/**
 * Shared Contract — Sourced statistics.
 *
 * THE central invariant of transparenC: no number is ever shown to a user as
 * bare prose. Every user-visible figure is a `SourcedStat` rendered through the
 * <SourcedStat> component, carrying its source, a deep link, and an "as of" date.
 */

import type { SourceId } from "./sources";

export interface SourcedStat {
  /** The figure itself. Strings allowed for pre-formatted values (e.g. "3.8×"). */
  value: number | string;
  /** Optional unit shown after the value, e.g. "%", "homes", "hours". */
  unit?: string;
  /** Plain-English description of what the figure measures. */
  label: string;
  /** FK → DataSource.id in the source registry. */
  sourceId: SourceId;
  /** Deep link to the EXACT dataset/release/page — never just the homepage. */
  sourceUrl: string;
  /** ISO date of the data PERIOD the figure describes (e.g. "2025-12-31"). */
  asOf: string;
  /** ISO timestamp the value was last refreshed from source (live/cache/snapshot). */
  fetchedAt?: string;
  /** Caveats a careful reader needs — e.g. IPSA expenses or provisional flags. */
  methodologyNote?: string;
}

/** Helper for static, verified facts that are stable between official releases. */
export function staticStat(
  s: Omit<SourcedStat, "fetchedAt"> & { fetchedAt?: string },
): SourcedStat {
  return s;
}

export function formatStatValue(stat: SourcedStat): string {
  const v =
    typeof stat.value === "number" ? stat.value.toLocaleString("en-GB") : stat.value;
  return stat.unit ? `${v}${stat.unit === "%" || stat.unit === "×" ? "" : " "}${stat.unit}` : v;
}
