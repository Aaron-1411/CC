import { NextResponse } from "next/server";
import { runAudit } from "@/lib/audit";
import { hasApiKey } from "@/lib/claude";
import { ragCounts, avgScore } from "@/lib/queries";

export const runtime = "edge";

export async function POST(req: Request) {
  let body: { brandId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { brandId } = body;
  if (!brandId) {
    return NextResponse.json({ error: "brandId is required." }, { status: 400 });
  }
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "No ANTHROPIC_API_KEY set. Add one to .env to run an audit." },
      { status: 400 },
    );
  }

  try {
    const result = await runAudit(brandId);
    return NextResponse.json({
      status: "COMPLETE",
      score: avgScore(result.pillars),
      rag: ragCounts(result.pillars),
      opportunities: result.opportunityMatrix.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Audit failed.";
    return NextResponse.json({ status: "FAILED", error: message }, { status: 500 });
  }
}
