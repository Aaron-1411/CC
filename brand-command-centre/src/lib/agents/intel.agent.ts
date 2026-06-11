import { runCompletion, extractJson } from "@/lib/claude";
import { brandContextBlock } from "./context-block";
import type {
  AgentFn,
  AgentInput,
  AgentOutput,
  CompetitorRecord,
  IntelReportPayload,
} from "@/types/agents";

interface IntelResult {
  report: IntelReportPayload;
  competitors: Array<{ name: string; url?: string; notes: string }>;
}

function periodLabel(): string {
  return `Week of ${new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

export const runIntelAgent: AgentFn = async (
  input: AgentInput,
): Promise<AgentOutput> => {
  const { brandContext: ctx } = input;

  const system = `You are a competitive-intelligence analyst for ${ctx.brand.name}.

Your job each week:
1. Identify the brand's main competitors and any notable moves (new products, pricing/promotion changes).
2. Surface category trends, growing search terms, and seasonal shifts.
3. Note any press mentions, new coverage, or reputation risks.
4. Note relevant influencer / creator activity in the niche.
Summarise into a concise weekly briefing a busy brand operator can read in two minutes.

Use web search to ground every claim in something current and real. Do not invent competitors or facts.

Return ONLY valid JSON in exactly this shape:
{
  "report": {
    "headline": "string — the single most important takeaway this week",
    "periodLabel": "${periodLabel()}",
    "sections": [
      { "heading": "Competitor moves", "bullets": ["..."] },
      { "heading": "Category trends", "bullets": ["..."] },
      { "heading": "Press & reputation", "bullets": ["..."] },
      { "heading": "Opportunities for us", "bullets": ["..."] }
    ],
    "recommendedActions": ["short, specific actions the other agents should take"]
  },
  "competitors": [
    { "name": "string", "url": "string (optional)", "notes": "what they're doing that matters" }
  ]
}`;

  const prompt = `Produce this week's competitive intelligence briefing for ${ctx.brand.name} (${ctx.brand.url}), industry: ${
    ctx.brand.industry ?? "unspecified"
  }. Focus on what should change our content, social, ads and promo decisions over the coming week. Return ONLY the JSON object.`;

  const raw = await runCompletion({
    cacheableSystem: brandContextBlock(ctx),
    system,
    prompt,
    maxTokens: 6000,
    webSearch: true,
    maxSearches: 6,
    thinking: true,
  });

  const result = extractJson<IntelResult>(raw);
  const observedAt = new Date().toISOString();

  const competitors: CompetitorRecord[] = (result.competitors ?? []).map((c) => ({
    name: c.name,
    url: c.url,
    notes: c.notes,
    observedAt,
  }));

  return {
    inboxItems: [
      {
        type: "INTEL_REPORT",
        title: result.report.headline || `Weekly intel — ${periodLabel()}`,
        description: "Weekly competitive intelligence briefing. Informational — no approval needed.",
        payload: { ...result.report, periodLabel: result.report.periodLabel || periodLabel() },
        pillarSource: 13,
        estimatedImpact: "Feeds Content, Social, Ads and Promo agents for the week ahead.",
      },
    ],
    contextUpdates: { competitors },
  };
};
