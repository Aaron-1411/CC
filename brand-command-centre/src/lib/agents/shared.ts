import type {
  BrandContextData,
  ContentPayload,
  EmailPayload,
} from "@/types/agents";
import type { PillarResult } from "@/types/analysis";

/** Map the brand's CMS to a ContentPayload target. */
export function cmsTargetFor(cmsType: string | null): ContentPayload["cmsTarget"] {
  switch (cmsType) {
    case "shopify":
      return "shopify_blog";
    case "wordpress":
      return "wordpress";
    case "webflow":
      return "webflow";
    default:
      return "manual";
  }
}

/** Map the brand's CMS to a likely ESP target for email. */
export function espTargetFor(cmsType: string | null): EmailPayload["espTarget"] {
  switch (cmsType) {
    case "shopify":
      return "klaviyo";
    case "wordpress":
      return "mailchimp";
    default:
      return "manual";
  }
}

/** ISO timestamp `days` from now at the given hour (local), for scheduling. */
export function isoInDays(days: number, hour = 9, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Human label for "this week" used in report periods. */
export function weekLabel(): string {
  return `Week of ${new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

/** A compact, model-friendly slug from a title. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

/**
 * Pull the pillars most relevant to an agent (worst-status first) so the agent
 * prompt can focus on real, audit-grounded gaps instead of generic advice.
 */
export function relevantGaps(
  ctx: BrandContextData,
  pillarIds: number[],
): PillarResult[] {
  const order: Record<string, number> = { RED: 0, AMBER: 1, GREEN: 2 };
  return [...ctx.auditFindings]
    .filter((p) => pillarIds.includes(p.id))
    .sort((a, b) => (order[a.status] ?? 3) - (order[b.status] ?? 3));
}

/** Render gap findings as prompt-ready bullets (or a graceful fallback). */
export function gapsBlock(gaps: PillarResult[]): string {
  if (gaps.length === 0) {
    return "No audit findings for these pillars yet — use your domain expertise and the brand context to choose the highest-leverage move.";
  }
  return gaps
    .map(
      (p) =>
        `- Pillar ${p.id} (${p.name}) — ${p.status}: ${p.summary}\n  Biggest opportunity: ${p.opportunity}`,
    )
    .join("\n");
}

/** Standard JSON-only instruction shared across agents. */
export const JSON_ONLY =
  "Return ONLY valid JSON matching the schema. No markdown fences, no prose before or after. Write as the brand itself, never as an AI describing what to do.";
