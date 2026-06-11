import { runCompletion, extractJson } from "@/lib/claude";
import { brandContextBlock } from "./context-block";
import { JSON_ONLY } from "./shared";
import type {
  AgentFn,
  AgentInput,
  AgentOutput,
  ReviewPayload,
} from "@/types/agents";

const PLATFORMS = ["trustpilot", "google", "product_page", "amazon"] as const;
type ReviewPlatform = (typeof PLATFORMS)[number];

interface ReviewsResult {
  reviews: Array<{
    platform: ReviewPlatform;
    reviewText: string;
    reviewRating: number;
    reviewerName: string;
    suggestedResponse: string;
    sentiment: "positive" | "neutral" | "negative";
  }>;
}

export const runReviewsAgent: AgentFn = async (
  input: AgentInput,
): Promise<AgentOutput> => {
  const { brandContext: ctx } = input;

  const system = `ROLE
You are a customer-experience and reputation manager who has handled review responses for major consumer brands. You know that a great public response is for the NEXT reader as much as the reviewer, that empathy beats defensiveness, and that you never argue, never sound like a template, and never offer compensation publicly that should be private.

OBJECTIVE
Find the brand's most recent, real, attributable customer reviews (Trustpilot, Google, Amazon, retailer product pages) and draft a specific, on-brand response to each. Cover a realistic mix — including any recent negatives, which matter most.

HARD RULES
- Use web search to find REAL reviews. Quote the reviewer's actual wording and use their public display name. If you cannot find genuine, attributable reviews, return an empty "reviews" array. NEVER invent a review or a reviewer.
- reviewRating is the real star rating (1–5).
- sentiment: negative for 1–3 stars or clearly unhappy; neutral for mixed; positive for 4–5 happy.

RESPONSE CRAFT (suggestedResponse)
- Open by thanking and addressing the person by name.
- Reference the SPECIFIC thing they mentioned — prove a human read it.
- Positive: reinforce what they loved, add a little brand warmth, invite them back. Keep it short.
- Negative: lead with genuine empathy, take ownership without excuses, state the concrete fix or next step, and move the resolution off-platform ("email us at … and we'll put this right"). Never blame the customer. Never sound legalistic.
- Always in the brand's tone of voice. 40–90 words. No emoji unless clearly on-brand.

OUTPUT SCHEMA
{
  "reviews": [
    {
      "platform": "trustpilot | google | product_page | amazon",
      "reviewText": "the real review text",
      "reviewRating": 5,
      "reviewerName": "public display name",
      "suggestedResponse": "your drafted reply",
      "sentiment": "positive | neutral | negative"
    }
  ]
}

${JSON_ONLY}`;

  const prompt = `Brand: ${ctx.brand.name} (${ctx.brand.url}). Find up to 5 of the most recent real customer reviews across platforms and draft a response to each. Prioritise anything negative or unanswered. If you genuinely cannot find real reviews, return {"reviews": []}. Return ONLY the JSON object.`;

  const raw = await runCompletion({
    cacheableSystem: brandContextBlock(ctx),
    system,
    prompt,
    maxTokens: 5000,
    webSearch: true,
    maxSearches: 4,
  });

  const result = extractJson<ReviewsResult>(raw);
  const reviews = (result.reviews ?? []).filter(
    (r) => r.reviewText && r.suggestedResponse && PLATFORMS.includes(r.platform),
  );

  return {
    inboxItems: reviews.map((r) => {
      const rating = Math.min(5, Math.max(1, Math.round(r.reviewRating || 0)));
      const flagged = rating <= 3 || r.sentiment === "negative";
      const payload: ReviewPayload = {
        platform: r.platform,
        reviewText: r.reviewText,
        reviewRating: rating,
        reviewerName: r.reviewerName || "Verified buyer",
        suggestedResponse: r.suggestedResponse,
        sentiment: r.sentiment,
        flagged,
      };
      return {
        type: "REVIEW_RESPONSE" as const,
        title: `${flagged ? "⚠ " : ""}${rating}★ on ${r.platform} — ${r.reviewerName || "review"}`,
        description: flagged
          ? "Negative/critical review — your approval required before this reply is posted."
          : "Positive review response — can auto-post when the agent is fully autonomous.",
        payload,
        pillarSource: 12,
        estimatedImpact: flagged
          ? "Protects reputation by resolving a critical review well."
          : "Reinforces social proof for the next reader.",
      };
    }),
  };
};
