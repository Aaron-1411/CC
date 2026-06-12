/**
 * Shared Contract — Pledge tracker.
 *
 * The flagship accountability surface. Every pledge carries a VERBATIM quote
 * with a deep link to its official source, and (where measurable) a metric
 * mapping to an official series. Status changes are logged with evidence.
 */

import type { SourcedStat } from "./stats";
import type { SourceId } from "./sources";

export type PledgeIssue =
  | "nhs"
  | "housing"
  | "economy"
  | "crime"
  | "environment"
  | "immigration"
  | "education";

/**
 * Six statuses. Rendered with text label + icon + colour — never colour alone.
 * Definitions are published verbatim on /methodology.
 */
export type PledgeStatus =
  | "on_track"
  | "in_progress"
  | "stalled"
  | "off_track"
  | "delivered"
  | "not_assessable";

export const PLEDGE_STATUS_LABEL: Record<PledgeStatus, string> = {
  on_track: "On track",
  in_progress: "In progress",
  stalled: "Stalled",
  off_track: "Off track",
  delivered: "Delivered",
  not_assessable: "Not yet assessable",
};

export interface PledgeStatusChange {
  date: string; // ISO
  from: PledgeStatus;
  to: PledgeStatus;
  /** One-paragraph reason citing data, with URLs. */
  evidence: string;
  evidenceUrls: string[];
}

export interface PledgeMetric {
  description: string; // "Net additional dwellings, England, cumulative from Jul 2024"
  sourceId: SourceId;
  seriesUrl: string; // deep link to the official series
  target: number;
  targetDate: string; // ISO
  currentValue: SourcedStat;
}

export interface Pledge {
  id: string; // stable, used in permalink /parties/pledge/{id}
  party: string;
  issue: PledgeIssue;
  quote: string; // VERBATIM pledge text — never paraphrased
  quoteSourceUrl: string; // manifesto PDF page / official transcript
  quoteDate: string; // ISO
  metric?: PledgeMetric; // present when measurable
  status: PledgeStatus;
  statusHistory: PledgeStatusChange[];
  /** Set when the source quote could not be located/verified — surfaces UNVERIFIED. */
  unverified?: boolean;
}
