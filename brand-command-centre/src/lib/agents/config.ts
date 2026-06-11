import { db } from "@/lib/db";
import {
  AGENT_META,
  type AgentConfigData,
  type AgentType,
  type AutonomyLevel,
} from "@/types/agents";

type AgentConfigRow = {
  id: string;
  brandId: string;
  agentType: string;
  enabled: boolean;
  scheduleExpr: string | null;
  autonomyLevel: string;
  config: unknown;
};

export function toConfigData(row: AgentConfigRow): AgentConfigData {
  return {
    id: row.id,
    brandId: row.brandId,
    agentType: row.agentType as AgentType,
    enabled: row.enabled,
    scheduleExpr: row.scheduleExpr,
    autonomyLevel: row.autonomyLevel as AutonomyLevel,
    config: (row.config as Record<string, unknown>) ?? {},
  };
}

/** Default config for a freshly seen agent. Autonomy defaults to approval for all. */
export function defaultConfigFor(agentType: AgentType) {
  const meta = AGENT_META[agentType];
  return {
    agentType,
    enabled: false,
    scheduleExpr: meta.defaultSchedule,
    autonomyLevel: "APPROVAL_REQUIRED" as AutonomyLevel,
    config: {} as Record<string, unknown>,
  };
}

export async function getOrCreateAgentConfig(
  brandId: string,
  agentType: AgentType,
): Promise<AgentConfigData> {
  const existing = await db.agentConfig.findUnique({
    where: { brandId_agentType: { brandId, agentType } },
  });
  if (existing) return toConfigData(existing);

  const d = defaultConfigFor(agentType);
  const created = await db.agentConfig.create({
    data: {
      brandId,
      agentType,
      enabled: d.enabled,
      scheduleExpr: d.scheduleExpr,
      autonomyLevel: d.autonomyLevel,
      config: d.config as object,
    },
  });
  return toConfigData(created);
}
