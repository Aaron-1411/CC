import { NextResponse } from "next/server";
import { orchestrator } from "@/lib/agents/orchestrator";
import { AGENT_TYPES, type AgentType } from "@/types/agents";

export const runtime = "edge";

export async function POST(req: Request) {
  let body: { brandId?: string; agentType?: string; pillarId?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { brandId, agentType, pillarId } = body;
  if (!brandId || !agentType) {
    return NextResponse.json(
      { error: "brandId and agentType are required." },
      { status: 400 },
    );
  }
  if (!AGENT_TYPES.includes(agentType as AgentType)) {
    return NextResponse.json({ error: `Unknown agent type: ${agentType}` }, { status: 400 });
  }

  const summary = await orchestrator.runAgent({
    brandId,
    agentType: agentType as AgentType,
    trigger: pillarId ? "PILLAR_TRIGGER" : "MANUAL",
    pillarId,
  });

  return NextResponse.json(summary);
}
