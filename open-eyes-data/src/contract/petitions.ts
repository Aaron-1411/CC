/**
 * Shared Contract — Petitions participation loop.
 *
 * Snapshots (captured by the scheduled job into KV) power velocity views.
 * Outcomes close the loop: what actually happened after people signed.
 */

export interface PetitionSnapshot {
  petitionId: number;
  capturedAt: string; // ISO
  signatureCount: number;
}

export interface PetitionOutcome {
  petitionId: number;
  responseThresholdReachedAt?: string;
  governmentResponseAt?: string;
  governmentResponseUrl?: string; // link to the response on petition.parliament.uk
  debateThresholdReachedAt?: string;
  debatedOn?: string;
  debateTranscriptUrl?: string; // Hansard
  debateVideoUrl?: string;
}

/** Official thresholds — verified 2026-06-12 against petition.parliament.uk/help. */
export const PETITION_RESPONSE_THRESHOLD = 10_000;
export const PETITION_DEBATE_THRESHOLD = 100_000;
