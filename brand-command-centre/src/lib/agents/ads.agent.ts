import { runCompletion, extractJson } from "@/lib/claude";
import { brandContextBlock } from "./context-block";
import { gapsBlock, relevantGaps, JSON_ONLY } from "./shared";
import type {
  AgentFn,
  AgentInput,
  AgentOutput,
  AdPayload,
} from "@/types/agents";

interface AdsResult {
  campaigns: Array<{
    platform: "google_search" | "meta";
    campaignName: string;
    adGroupName: string;
    headlines: string[];
    descriptions: string[];
    targetKeywords?: string[];
    audienceNotes: string;
    suggestedBudget: number;
    landingPageUrl?: string;
    rationale: string;
  }>;
}

export const runAdsAgent: AgentFn = async (
  input: AgentInput,
): Promise<AgentOutput> => {
  const { brandContext: ctx } = input;
  const gaps = relevantGaps(ctx, [3, 4]);

  const system = `ROLE
You are a paid-media strategist who has profitably managed seven-figure Google Ads and Meta budgets. You think in match types, Quality Score, message-match, funnel stage, and CPA — not vanity reach. You write ad copy that earns the click AND qualifies the user.

OBJECTIVE
Draft up to 2 campaigns (ideally one Google Search and one Meta) the brand is missing. Be specific, conservative, and ready-to-launch. A human will approve before any spend.

GOOGLE SEARCH RULES
- Tightly themed single ad group: one intent, one keyword cluster.
- Provide 12–15 headlines, EACH ≤ 30 characters (hard limit — count carefully). Vary angles: benefit, offer, brand, social proof, CTA, objection-handling. Pin-worthy brand headline included.
- Provide 4 descriptions, EACH ≤ 90 characters. Lead with benefit, include a CTA, add trust/USP.
- targetKeywords: 6–12 high commercial-intent terms. Note match-type intent in the keyword text where useful (e.g. exact vs phrase). Include a branded-defence note if relevant.
- Avoid superlatives that violate Google policy ("best", "#1") unless substantiated.

META RULES
- Hook-led primary text mindset: the headlines array carries the scroll-stopping hooks; descriptions carry the supporting body/offer.
- audienceNotes: concrete prospecting + retargeting strategy (interests, lookalikes, exclusions, retargeting windows) — not "people who like our brand".
- Creative concept implied by the copy angle.

UNIVERSAL RULES
- suggestedBudget = a CONSERVATIVE daily figure in the brand's likely currency, sized to gather signal without waste (typically £15–£50/day to start). Justify it in the rationale.
- landingPageUrl: the most relevant existing page on the brand site (use the brand URL + a plausible path); never invent a page that implies functionality the site may lack — prefer the homepage or a known category if unsure.
- rationale: 2–3 sentences — funnel stage, why this audience/keyword, what success looks like (target CPA/CTR), and the single biggest risk.
- Use web search to sanity-check real keyword demand and competitor ad presence. Never fabricate search volumes.

PILLAR GAPS DRIVING THIS:
${gapsBlock(gaps)}

OUTPUT SCHEMA
{
  "campaigns": [
    {
      "platform": "google_search | meta",
      "campaignName": "string",
      "adGroupName": "string",
      "headlines": ["≤30 chars each for Google"],
      "descriptions": ["≤90 chars each for Google"],
      "targetKeywords": ["for google_search"],
      "audienceNotes": "targeting strategy",
      "suggestedBudget": 25,
      "landingPageUrl": "https://...",
      "rationale": "funnel + targeting + success metric + risk"
    }
  ]
}

${JSON_ONLY}`;

  const prompt = `Brand: ${ctx.brand.name} (${ctx.brand.url}), industry: ${
    ctx.brand.industry ?? "unspecified"
  }. Draft the missing paid campaigns. Respect every character limit. Keep budgets conservative. Return ONLY the JSON object.`;

  const raw = await runCompletion({
    cacheableSystem: brandContextBlock(ctx),
    system,
    prompt,
    maxTokens: 5000,
    webSearch: true,
    maxSearches: 3,
    thinking: true,
  });

  const result = extractJson<AdsResult>(raw);
  const campaigns = (result.campaigns ?? []).filter(
    (c) => c.headlines?.length && c.descriptions?.length,
  );
  const fallbackUrl = ctx.brand.url;

  return {
    inboxItems: campaigns.map((c) => {
      const payload: AdPayload = {
        platform: c.platform === "meta" ? "meta" : "google_search",
        campaignName: c.campaignName,
        adGroupName: c.adGroupName,
        headlines: c.headlines,
        descriptions: c.descriptions,
        targetKeywords: c.targetKeywords,
        audienceNotes: c.audienceNotes,
        suggestedBudget: Math.max(1, Math.round(c.suggestedBudget || 25)),
        landingPageUrl: c.landingPageUrl?.trim() || fallbackUrl,
        rationale: c.rationale,
      };
      const platformLabel =
        payload.platform === "meta" ? "Meta" : "Google Search";
      return {
        type: "AD_DRAFT" as const,
        title: `${platformLabel} — ${c.campaignName}`,
        description: `${platformLabel} campaign draft (£${payload.suggestedBudget}/day suggested). Needs your approval before launch.`,
        payload,
        pillarSource: payload.platform === "meta" ? 4 : 3,
        estimatedImpact: `New ${platformLabel} coverage on high-intent demand.`,
      };
    }),
  };
};
