import type { BrandContextData } from "@/types/agents";

/**
 * The shared brand-context preamble injected at the top of every agent's
 * system prompt. This is the "shared memory" that prevents duplication and
 * keeps every agent on-brand. Kept compact to stay well under the token budget.
 */
export function brandContextBlock(ctx: BrandContextData): string {
  const { brand } = ctx;
  const findings =
    ctx.auditFindings.length > 0
      ? ctx.auditFindings
          .map((p) => `  - Pillar ${p.id} (${p.name}): ${p.status} — ${p.opportunity}`)
          .join("\n")
      : "  - No audit findings yet.";

  return `BRAND CONTEXT (read carefully — it governs everything you produce):
Name: ${brand.name}
URL: ${brand.url}
Industry: ${brand.industry ?? "unspecified"}
Tone of voice: ${brand.toneOfVoice ?? "professional, warm, concise"}

WHAT HAS ALREADY BEEN DONE (never duplicate):
Published content URLs: ${ctx.publishedUrls.slice(-20).join(", ") || "none"}
Recent social posts: ${JSON.stringify(ctx.postedContent.slice(-10))}
Active promotions: ${JSON.stringify(ctx.activePromos)}

COMPETITOR INTEL (latest from Intel agent):
${JSON.stringify(ctx.competitors.slice(-10))}

AUDIT FINDINGS SUMMARY:
${findings}`;
}

/** Standard closing instruction appended to every agent prompt. */
export const AGENT_OUTPUT_CONTRACT = `Return ONLY valid JSON. No prose outside the JSON.
Your output will be shown to a human reviewer before publishing.
Write as if you are the brand — not as an AI describing what the brand should write.`;
