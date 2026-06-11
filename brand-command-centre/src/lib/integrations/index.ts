import type {
  AgentPayload,
  ContentPayload,
  InboxItemType,
  ReviewPayload,
  SocialPayload,
} from "@/types/agents";

export interface PublishResult {
  externalId?: string;
  externalUrl?: string;
  note: string; // human-readable status, shown in History
}

/**
 * Route an approved item to the right publish integration. Integrations are
 * intentionally stubbed: they never silently fail, they always return a clear
 * status, and the real API calls slot in behind the same contract. Everything
 * here is edge-safe (no filesystem) — the full content of every published item
 * is persisted on the PublishedItem record and viewable from History.
 */
export async function publishItem(
  type: InboxItemType,
  payload: AgentPayload,
  brand: { id: string; cmsType: string | null },
): Promise<PublishResult> {
  switch (type) {
    case "BLOG_POST":
      return publishToCms(payload as ContentPayload, brand);
    case "SOCIAL_POST":
      return scheduleToBuffer(payload as SocialPayload);
    case "REVIEW_RESPONSE":
      return postReviewResponse(payload as ReviewPayload);
    default:
      // AD_DRAFT, EMAIL_FLOW, PROMO_OFFER, INTEL_REPORT have no auto-publish path.
      return { note: "Approved. No external publish step for this item type." };
  }
}

// ── CMS (blog) ────────────────────────────────────────────────────────
export async function publishToCms(
  payload: ContentPayload,
  brand: { cmsType: string | null },
): Promise<PublishResult> {
  // TODO: Shopify Admin API / WordPress REST API when credentials are configured.
  const target =
    brand.cmsType === "shopify"
      ? "Shopify"
      : brand.cmsType === "wordpress"
        ? "WordPress"
        : "your CMS";
  return {
    note: `Draft ready for ${target}: “${payload.title}” (connect ${target} in Settings to publish live). Full post saved to History.`,
  };
}

// ── Social scheduler ──────────────────────────────────────────────────
export async function scheduleToBuffer(payload: SocialPayload): Promise<PublishResult> {
  // TODO: Buffer/Later API when BUFFER_ACCESS_TOKEN is configured.
  return {
    note: `Queued ${payload.platform} post for ${new Date(payload.scheduledFor).toLocaleString()} (connect Buffer in Settings to schedule live).`,
  };
}

// ── Reviews ───────────────────────────────────────────────────────────
export async function postReviewResponse(payload: ReviewPayload): Promise<PublishResult> {
  // TODO: Trustpilot / Google Business API. For now mark ready-to-post.
  return {
    note: `Response ready to post on ${payload.platform}. Copy from History or connect the platform in Settings.`,
  };
}
