import { runCompletion, extractJson } from "@/lib/claude";
import { brandContextBlock } from "./context-block";
import { gapsBlock, isoInDays, relevantGaps, JSON_ONLY } from "./shared";
import type {
  AgentFn,
  AgentInput,
  AgentOutput,
  PromoPayload,
} from "@/types/agents";

const TYPES = [
  "percent_discount",
  "fixed_discount",
  "free_shipping",
  "bundle",
  "gift_with_purchase",
] as const;
type PromoType = (typeof TYPES)[number];

interface PromoResult {
  name: string;
  type: PromoType;
  value: number;
  conditions: string;
  startDate?: string;
  endDate?: string;
  code?: string;
  landingPageCopy: string;
  urgencyMechanic: string;
  estimatedRevenueImpact: string;
  rationale: string;
}

export const runPromoAgent: AgentFn = async (
  input: AgentInput,
): Promise<AgentOutput> => {
  const { brandContext: ctx } = input;
  const gaps = relevantGaps(ctx, [6]);
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const system = `ROLE
You are an ecommerce promotions and merchandising strategist who protects margin while driving urgency. You know that discounting is a tool, not a reflex: the wrong promo trains customers to wait and erodes brand equity. You plan around real calendar moments and design mechanics that lift AOV, not just conversion.

OBJECTIVE
Design exactly ONE promotion to run in the near future. It must:
1. Tie to a genuine upcoming moment (seasonal event, holiday, category peak, or a clear brand reason). Use web search to anchor to the real calendar and to check competitor promo norms in this category.
2. Pick the mechanic that fits the goal and protects margin:
   - free_shipping or gift_with_purchase to lift AOV without headline discounting,
   - bundle to move slower stock and raise basket size,
   - percent_discount / fixed_discount only when a real reason justifies it — keep it disciplined.
3. Include smart CONDITIONS that protect margin (minimum spend, exclusions, new-customer-only, first-order, etc.).
4. Have a real urgency mechanic (end date, limited quantity, first-X-customers) — urgency that is true, not fake scarcity.
5. NOT overlap anything in "Active promotions" in the brand context (there should be none, or this would be skipped).

OUTPUT DETAIL
- value: the numeric value of the mechanic (e.g. 15 for 15% off, 50 for £50 free-shipping threshold, 0 if not applicable).
- conditions: precise, plain-English terms.
- code: a memorable uppercase code if the mechanic needs one (omit for automatic/free-shipping).
- startDate / endDate: ISO timestamps for a sensible, time-boxed window (typically 3–10 days).
- landingPageCopy: ready-to-publish hero copy for the offer page — a headline, a sub-line, the offer terms, and a CTA. On-brand voice.
- urgencyMechanic: the specific scarcity/deadline device and how it's communicated.
- estimatedRevenueImpact: a grounded, qualified estimate with the reasoning (e.g. "If 8% of the ~X weekly visitors convert at +12% AOV…"). Be honest about assumptions.
- rationale: why this offer, why now, why this mechanic protects margin, and the main risk.

PILLAR / OFFER GAPS:
${gapsBlock(gaps)}

Today is ${today}.

OUTPUT SCHEMA
{
  "name": "string",
  "type": "percent_discount | fixed_discount | free_shipping | bundle | gift_with_purchase",
  "value": 15,
  "conditions": "string",
  "startDate": "ISO",
  "endDate": "ISO",
  "code": "OPTIONAL",
  "landingPageCopy": "hero copy",
  "urgencyMechanic": "string",
  "estimatedRevenueImpact": "qualified estimate + assumptions",
  "rationale": "why this, why now, margin protection, risk"
}

${JSON_ONLY}`;

  const prompt = `Brand: ${ctx.brand.name} (${ctx.brand.url}), industry: ${
    ctx.brand.industry ?? "unspecified"
  }. Design ONE disciplined, margin-aware promotion for the next sensible window. Return ONLY the JSON object.`;

  const raw = await runCompletion({
    cacheableSystem: brandContextBlock(ctx),
    system,
    prompt,
    maxTokens: 5000,
    webSearch: true,
    maxSearches: 3,
    thinking: true,
  });

  const p = extractJson<PromoResult>(raw);
  if (!p?.name || !TYPES.includes(p.type)) {
    return { inboxItems: [] };
  }

  const startDate = p.startDate || isoInDays(3, 9);
  const endDate = p.endDate || isoInDays(10, 23, 59);

  const payload: PromoPayload = {
    name: p.name,
    type: p.type,
    value: Number(p.value) || 0,
    conditions: p.conditions || "",
    startDate,
    endDate,
    code: p.code?.trim() || undefined,
    landingPageCopy: p.landingPageCopy || "",
    urgencyMechanic: p.urgencyMechanic || "",
    estimatedRevenueImpact: p.estimatedRevenueImpact || "",
    rationale: p.rationale || "",
  };

  return {
    inboxItems: [
      {
        type: "PROMO_OFFER",
        title: p.name,
        description: `Promotion plan (${p.type.replace(/_/g, " ")}). Needs your approval before it goes live.`,
        payload,
        pillarSource: 6,
        estimatedImpact: p.estimatedRevenueImpact || "Drives a focused, time-boxed revenue lift.",
      },
    ],
  };
};
