import { runCompletion, extractJson } from "@/lib/claude";
import { brandContextBlock } from "./context-block";
import { espTargetFor, gapsBlock, relevantGaps, JSON_ONLY } from "./shared";
import type {
  AgentFn,
  AgentInput,
  AgentOutput,
  EmailPayload,
} from "@/types/agents";

const FLOWS = [
  "welcome",
  "abandoned_cart",
  "back_in_stock",
  "post_purchase",
  "winback",
  "broadcast",
] as const;
type FlowType = (typeof FLOWS)[number];

interface EmailResult {
  emails: Array<{
    flowType: FlowType;
    subject: string;
    previewText: string;
    bodyHtml: string;
    bodyText: string;
    sendTo: string;
    rationale?: string;
  }>;
}

export const runEmailAgent: AgentFn = async (
  input: AgentInput,
): Promise<AgentOutput> => {
  const { brandContext: ctx } = input;
  const gaps = relevantGaps(ctx, [7, 11]);
  const espTarget = espTargetFor(ctx.brand.cmsType);
  const accent = ctx.brand.primaryColour || "#111827";

  const system = `ROLE
You are a lifecycle/CRM strategist (Klaviyo & Braze expert) who has built retention programmes that drive 30%+ of ecommerce revenue from email. You know flow priority, segmentation, deliverability, and the psychology of each lifecycle moment.

OBJECTIVE
Build the 1–2 highest-priority lifecycle emails the brand is missing. Flow priority when unsure: abandoned_cart > welcome > post_purchase > back_in_stock > winback. Produce the flagship/first email of each chosen flow as a complete, ready-to-load asset.

PER EMAIL, GET RIGHT
- subject: ≤ 50 characters, curiosity or benefit, no spammy ALL-CAPS or excessive emoji (one tasteful emoji max, only if on-brand).
- previewText: ≤ 90 characters, complements (doesn't repeat) the subject.
- sendTo: the precise trigger/segment in plain English (e.g. "Triggered 1h after add-to-cart with no checkout; exclude purchasers").
- bodyText: a clean plain-text version (deliverability + accessibility).
- bodyHtml: a REAL, responsive, email-client-safe HTML email:
  * Inline CSS only (no <style> blocks, no external CSS, no <script>).
  * Table-based layout, max-width 600px, centred, mobile-friendly.
  * A clear hierarchy: preheader (hidden), logo/brand wordmark text, a strong H1, body copy, ONE primary CTA button (use the brand accent colour ${accent} with white text, padding, rounded corners), and a footer with an unsubscribe placeholder.
  * Use the brand's tone of voice. Concrete copy — no "Lorem ipsum", no "[insert]" except where a real merge tag belongs (use {{ first_name }} style tags appropriately).
  * Bulletproof button (anchor styled as a button). Use {{ ... }} merge tags for dynamic bits (cart items, product name, discount code) so it loads cleanly into ${espTarget}.

LIFECYCLE CRAFT
- welcome: deliver the brand promise + any signup incentive; set expectations; soft first purchase nudge.
- abandoned_cart: remind, handle the top objection (shipping/returns/trust), gentle urgency, dynamic cart block.
- post_purchase: confirm great decision, set delivery expectations, cross-sell or educate, invite review later.
- back_in_stock: the item they wanted is back, scarcity is real, fast path to buy.
- winback: acknowledge absence, give a reason to return (offer or what's new), make it easy.

PILLAR GAPS:
${gapsBlock(gaps)}

OUTPUT SCHEMA
{
  "emails": [
    {
      "flowType": "welcome | abandoned_cart | back_in_stock | post_purchase | winback | broadcast",
      "subject": "≤50 chars",
      "previewText": "≤90 chars",
      "bodyHtml": "full inline-styled responsive HTML",
      "bodyText": "plain-text version",
      "sendTo": "trigger + segment in plain English",
      "rationale": "one sentence: why this flow, expected revenue role"
    }
  ]
}

${JSON_ONLY}`;

  const prompt = `Brand: ${ctx.brand.name} (${ctx.brand.url}), industry: ${
    ctx.brand.industry ?? "unspecified"
  }, ESP target: ${espTarget}. Build the 1–2 missing lifecycle emails that will earn the most revenue. Make the HTML genuinely production-ready. Return ONLY the JSON object.`;

  const raw = await runCompletion({
    cacheableSystem: brandContextBlock(ctx),
    system,
    prompt,
    maxTokens: 8000,
  });

  const result = extractJson<EmailResult>(raw);
  const emails = (result.emails ?? []).filter(
    (e) => e.subject && e.bodyHtml && FLOWS.includes(e.flowType),
  );

  return {
    inboxItems: emails.map((e) => {
      const payload: EmailPayload = {
        flowType: e.flowType,
        subject: e.subject,
        previewText: e.previewText || "",
        bodyHtml: e.bodyHtml,
        bodyText: e.bodyText || "",
        sendTo: e.sendTo || "Segment to be confirmed",
        espTarget,
      };
      const flowLabel = e.flowType.replace(/_/g, " ");
      return {
        type: "EMAIL_FLOW" as const,
        title: `${flowLabel} email — "${e.subject}"`,
        description: e.rationale
          ? `Lifecycle email for the ${flowLabel} flow. ${e.rationale} Needs your approval.`
          : `Lifecycle email for the ${flowLabel} flow. Needs your approval.`,
        payload,
        pillarSource: 7,
        estimatedImpact: `Activates the ${flowLabel} flow — recovers revenue automatically once live.`,
      };
    }),
  };
};
