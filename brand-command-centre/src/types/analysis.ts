import type { AgentType } from "./agents";

// ── Audit / 13-pillar analysis types ──────────────────────────────────

export type RAGStatus = "GREEN" | "AMBER" | "RED";
export type AuditStatus = "PENDING" | "RUNNING" | "COMPLETE" | "FAILED";

/** Static definition of a pillar (the rubric). See lib/pillars.ts. */
export interface PillarDefinition {
  id: number;
  key: string; // machine key, e.g. "seo"
  name: string; // human name, e.g. "SEO & Organic Search"
  category: string; // grouping for the UI
  description: string; // what this pillar measures
  whatGoodLooksLike: string; // the benchmark for GREEN
  recommendedAgents: AgentType[]; // which agents act on gaps here
}

/** Result of analysing one pillar for a specific brand. */
export interface PillarResult {
  id: number;
  key: string;
  name: string;
  status: RAGStatus;
  score: number; // 0–100
  summary: string; // one-line headline
  findings: string[]; // bullet observations
  opportunity: string; // the single biggest opportunity
  recommendedAgents: AgentType[];
}

export type Impact = "HIGH" | "MEDIUM" | "LOW";
export type Effort = "HIGH" | "MEDIUM" | "LOW";

/** A prioritised action derived from the pillar results. */
export interface OpportunityItem {
  title: string;
  pillarId: number;
  impact: Impact;
  effort: Effort;
  action: string; // plain-English next step
  recommendedAgent?: AgentType;
}

export interface AuditResult {
  pillars: PillarResult[];
  opportunityMatrix: OpportunityItem[];
}
