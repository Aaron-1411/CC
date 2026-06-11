import { db } from "./db";
import { getOrCreateAgentConfig } from "./agents/config";
import { isAgentImplemented } from "./agents/registry";
import { AGENT_TYPES, type AgentType, type InboxStatus } from "@/types/agents";
import type { OpportunityItem, PillarResult } from "@/types/analysis";

// ── Brands ────────────────────────────────────────────────────────────
export async function getBrands() {
  return db.brand.findMany({ orderBy: { createdAt: "asc" } });
}

export async function getBrand(brandId: string) {
  return db.brand.findUnique({ where: { id: brandId } });
}

export async function getFirstBrandId(): Promise<string | null> {
  const b = await db.brand.findFirst({ orderBy: { createdAt: "asc" } });
  return b?.id ?? null;
}

// ── Inbox ─────────────────────────────────────────────────────────────
export async function getPendingCount(brandId: string): Promise<number> {
  return db.inboxItem.count({ where: { brandId, status: "PENDING" } });
}

export async function getInboxItems(
  brandId: string,
  opts: { status?: InboxStatus; agentType?: AgentType } = {},
) {
  return db.inboxItem.findMany({
    where: {
      brandId,
      status: opts.status ?? "PENDING",
      ...(opts.agentType ? { agentType: opts.agentType } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInboxItem(itemId: string) {
  return db.inboxItem.findUnique({ where: { id: itemId } });
}

// ── Agents ────────────────────────────────────────────────────────────
export interface AgentStatus {
  agentType: AgentType;
  enabled: boolean;
  scheduleExpr: string | null;
  autonomyLevel: string;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  runCount: number;
  pendingCount: number;
  implemented: boolean;
}

export async function getAgentsStatus(brandId: string): Promise<AgentStatus[]> {
  // Make sure every agent has a config row, then read them all.
  await Promise.all(AGENT_TYPES.map((t) => getOrCreateAgentConfig(brandId, t)));

  const [configs, pendingItems] = await Promise.all([
    db.agentConfig.findMany({ where: { brandId } }),
    db.inboxItem.findMany({ where: { brandId, status: "PENDING" } }),
  ]);

  // Tally pending items per agent (replaces a Prisma groupBy).
  const pendingMap = new Map<string, number>();
  for (const item of pendingItems) {
    pendingMap.set(item.agentType, (pendingMap.get(item.agentType) ?? 0) + 1);
  }

  return AGENT_TYPES.map((agentType) => {
    const c = configs.find((x) => x.agentType === agentType);
    return {
      agentType,
      enabled: c?.enabled ?? false,
      scheduleExpr: c?.scheduleExpr ?? null,
      autonomyLevel: c?.autonomyLevel ?? "APPROVAL_REQUIRED",
      lastRunAt: c?.lastRunAt ?? null,
      nextRunAt: c?.nextRunAt ?? null,
      runCount: c?.runCount ?? 0,
      pendingCount: pendingMap.get(agentType) ?? 0,
      implemented: isAgentImplemented(agentType),
    };
  });
}

export async function getRecentRuns(brandId: string, agentType?: AgentType, take = 8) {
  return db.agentRun.findMany({
    where: { brandId, ...(agentType ? { agentType } : {}) },
    orderBy: { startedAt: "desc" },
    take,
  });
}

// ── History / published ───────────────────────────────────────────────
export async function getHistory(brandId: string, take = 50) {
  return db.publishedItem.findMany({
    where: { brandId },
    orderBy: { publishedAt: "desc" },
    take,
  });
}

export async function getPublishedCount(brandId: string): Promise<number> {
  return db.publishedItem.count({ where: { brandId } });
}

// ── Audit ─────────────────────────────────────────────────────────────
export async function getLatestAudit(brandId: string) {
  return db.audit.findFirst({
    where: { brandId },
    orderBy: { startedAt: "desc" },
  });
}

export function pillarsFromAudit(audit: { pillars: unknown } | null): PillarResult[] {
  if (!audit) return [];
  const p = audit.pillars;
  if (Array.isArray(p)) return p as PillarResult[];
  return [];
}

export function opportunitiesFromAudit(
  audit: { opportunityMatrix?: unknown } | null,
): OpportunityItem[] {
  if (!audit) return [];
  const m = audit.opportunityMatrix;
  return Array.isArray(m) ? (m as OpportunityItem[]) : [];
}

export function avgScore(pillars: PillarResult[]): number {
  if (pillars.length === 0) return 0;
  return Math.round(pillars.reduce((s, p) => s + (p.score ?? 0), 0) / pillars.length);
}

export interface RagCounts {
  green: number;
  amber: number;
  red: number;
}

export function ragCounts(pillars: PillarResult[]): RagCounts {
  return {
    green: pillars.filter((p) => p.status === "GREEN").length,
    amber: pillars.filter((p) => p.status === "AMBER").length,
    red: pillars.filter((p) => p.status === "RED").length,
  };
}
