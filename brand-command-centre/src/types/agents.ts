import type { PillarResult } from "./analysis";

// ── Enums-as-unions (SQLite stores these as String) ───────────────────

export const AGENT_TYPES = [
  "CONTENT",
  "SOCIAL",
  "ADS",
  "EMAIL",
  "REVIEWS",
  "PROMO",
  "INTEL",
] as const;
export type AgentType = (typeof AGENT_TYPES)[number];

export const AUTONOMY_LEVELS = ["FULLY_AUTONOMOUS", "APPROVAL_REQUIRED"] as const;
export type AutonomyLevel = (typeof AUTONOMY_LEVELS)[number];

export const INBOX_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "PUBLISHED",
] as const;
export type InboxStatus = (typeof INBOX_STATUSES)[number];

export const INBOX_ITEM_TYPES = [
  "BLOG_POST",
  "SOCIAL_POST",
  "AD_DRAFT",
  "EMAIL_FLOW",
  "PROMO_OFFER",
  "REVIEW_RESPONSE",
  "INTEL_REPORT",
] as const;
export type InboxItemType = (typeof INBOX_ITEM_TYPES)[number];

export type TriggerType = "SCHEDULE" | "MANUAL" | "PILLAR_TRIGGER";

// ── Brand context (deserialised, runtime shape) ───────────────────────

export interface BrandSummary {
  id: string;
  name: string;
  url: string;
  industry: string | null;
  toneOfVoice: string | null;
  primaryColour: string | null;
  cmsType: string | null;
}

export interface BrandContextData {
  brand: BrandSummary;
  auditFindings: PillarResult[];
  competitors: CompetitorRecord[];
  publishedUrls: string[];
  postedContent: PostedContentRecord[];
  activePromos: ActivePromoRecord[];
  approvedAssets: ApprovedAsset[];
}

export interface CompetitorRecord {
  name: string;
  url?: string;
  notes: string;
  observedAt: string; // ISO date
}

export interface PostedContentRecord {
  platform: string;
  caption: string;
  postedAt: string;
}

export interface ActivePromoRecord {
  name: string;
  code?: string;
  startDate: string;
  endDate: string;
}

export interface ApprovedAsset {
  kind: string;
  value: string;
}

// ── Agent IO contract ─────────────────────────────────────────────────

export interface AgentConfigData {
  id: string;
  brandId: string;
  agentType: AgentType;
  enabled: boolean;
  scheduleExpr: string | null;
  autonomyLevel: AutonomyLevel;
  config: Record<string, unknown>;
}

export interface AgentInput {
  brandContext: BrandContextData;
  auditFindings: PillarResult[];
  config: AgentConfigData;
}

export interface AgentDraft {
  type: InboxItemType;
  title: string;
  description: string;
  payload: AgentPayload;
  estimatedImpact?: string;
  pillarSource?: number;
}

export interface AgentOutput {
  inboxItems: AgentDraft[];
  contextUpdates?: Partial<
    Pick<
      BrandContextData,
      "competitors" | "publishedUrls" | "postedContent" | "activePromos" | "approvedAssets"
    >
  >;
  nextRunSuggestion?: Date;
}

export interface AgentRunRequest {
  brandId: string;
  agentType: AgentType;
  trigger: TriggerType;
  pillarId?: number;
}

export type AgentFn = (input: AgentInput) => Promise<AgentOutput>;

// ── Payloads ──────────────────────────────────────────────────────────

export interface ContentPayload {
  title: string;
  slug: string;
  body: string; // Markdown
  metaTitle: string;
  metaDescription: string;
  targetKeyword: string;
  estimatedWordCount: number;
  cmsTarget: "shopify_blog" | "wordpress" | "webflow" | "manual";
}

export interface SocialPayload {
  platform: "instagram" | "tiktok" | "linkedin" | "twitter_x" | "pinterest";
  caption: string;
  hashtags: string[];
  scheduledFor: string; // ISO
  imagePrompt?: string;
  contentSourceUrl?: string;
}

export interface AdPayload {
  platform: "google_search" | "meta";
  campaignName: string;
  adGroupName: string;
  headlines: string[];
  descriptions: string[];
  targetKeywords?: string[];
  audienceNotes: string;
  suggestedBudget: number; // daily
  landingPageUrl: string;
  rationale: string;
}

export interface EmailPayload {
  flowType:
    | "welcome"
    | "abandoned_cart"
    | "back_in_stock"
    | "post_purchase"
    | "winback"
    | "broadcast";
  subject: string;
  previewText: string;
  bodyHtml: string;
  bodyText: string;
  sendTo: string;
  scheduledFor?: string;
  espTarget: "klaviyo" | "mailchimp" | "dotdigital" | "manual";
}

export interface PromoPayload {
  name: string;
  type:
    | "percent_discount"
    | "fixed_discount"
    | "free_shipping"
    | "bundle"
    | "gift_with_purchase";
  value: number;
  conditions: string;
  startDate: string;
  endDate: string;
  code?: string;
  landingPageCopy: string;
  urgencyMechanic: string;
  estimatedRevenueImpact: string;
  rationale: string;
}

export interface ReviewPayload {
  platform: "trustpilot" | "google" | "product_page" | "amazon";
  reviewText: string;
  reviewRating: number;
  reviewerName: string;
  suggestedResponse: string;
  sentiment: "positive" | "neutral" | "negative";
  flagged: boolean;
}

export interface IntelReportSection {
  heading: string;
  bullets: string[];
}

export interface IntelReportPayload {
  headline: string;
  periodLabel: string; // e.g. "Week of 7 Jun 2026"
  sections: IntelReportSection[];
  recommendedActions: string[];
}

export type AgentPayload =
  | ContentPayload
  | SocialPayload
  | AdPayload
  | EmailPayload
  | PromoPayload
  | ReviewPayload
  | IntelReportPayload;

// ── UI metadata: per-agent presentation ───────────────────────────────

export interface AgentMeta {
  type: AgentType;
  label: string; // "Content agent"
  short: string; // "Content"
  colour: string; // hex dot colour
  blurb: string; // one-paragraph what-it-does
  defaultSchedule: string; // cron
  scheduleLabel: string; // human
  alwaysApproval: boolean; // budget/pricing agents
  triggerPillars: number[];
  produces: InboxItemType;
}

export const AGENT_META: Record<AgentType, AgentMeta> = {
  INTEL: {
    type: "INTEL",
    label: "Intel agent",
    short: "Intel",
    colour: "#64748b",
    blurb:
      "Researches competitors, category trends, press mentions and reputation risks every week, then briefs you and feeds the other agents.",
    defaultSchedule: "0 18 * * 0",
    scheduleLabel: "Weekly · Sunday 18:00",
    alwaysApproval: false,
    triggerPillars: [13],
    produces: "INTEL_REPORT",
  },
  CONTENT: {
    type: "CONTENT",
    label: "Content agent",
    short: "Content",
    colour: "#14b8a6",
    blurb:
      "Writes SEO blog drafts targeting uncontested keywords with clear commercial intent, never repeating a topic you've already published.",
    defaultSchedule: "0 7 * * 1",
    scheduleLabel: "Weekly · Monday 07:00",
    alwaysApproval: false,
    triggerPillars: [2, 9],
    produces: "BLOG_POST",
  },
  SOCIAL: {
    type: "SOCIAL",
    label: "Social agent",
    short: "Social",
    colour: "#a855f7",
    blurb:
      "Plans native, platform-correct posts across the next few days, promoting new content and reacting to what's trending in your niche.",
    defaultSchedule: "0 8 * * *",
    scheduleLabel: "Daily · 08:00",
    alwaysApproval: false,
    triggerPillars: [8],
    produces: "SOCIAL_POST",
  },
  ADS: {
    type: "ADS",
    label: "Ads agent",
    short: "Ads",
    colour: "#f59e0b",
    blurb:
      "Drafts Google Search and Meta campaigns — headlines, descriptions, targeting and a conservative suggested budget. Always needs your sign-off.",
    defaultSchedule: "0 9 * * 1",
    scheduleLabel: "Weekly · Monday 09:00",
    alwaysApproval: true,
    triggerPillars: [3, 4],
    produces: "AD_DRAFT",
  },
  EMAIL: {
    type: "EMAIL",
    label: "Email agent",
    short: "Email",
    colour: "#3b82f6",
    blurb:
      "Builds the lifecycle flows you're missing — welcome, abandoned cart, back-in-stock, win-back — as complete, ready-to-load sequences.",
    defaultSchedule: "0 10 * * 1",
    scheduleLabel: "Weekly · Monday 10:00",
    alwaysApproval: true,
    triggerPillars: [7],
    produces: "EMAIL_FLOW",
  },
  REVIEWS: {
    type: "REVIEWS",
    label: "Reviews agent",
    short: "Reviews",
    colour: "#22c55e",
    blurb:
      "Finds new reviews, drafts specific, on-brand responses, and posts the positive ones automatically. Negative reviews always come to you first.",
    defaultSchedule: "0 6 * * *",
    scheduleLabel: "Daily · 06:00",
    alwaysApproval: false,
    triggerPillars: [12],
    produces: "REVIEW_RESPONSE",
  },
  PROMO: {
    type: "PROMO",
    label: "Promo agent",
    short: "Promo",
    colour: "#fb7185",
    blurb:
      "Plans non-overlapping promotions around seasonal moments, with discount mechanics, landing copy and a cross-channel activation plan.",
    defaultSchedule: "0 9 1 * *",
    scheduleLabel: "Monthly · 1st 09:00",
    alwaysApproval: true,
    triggerPillars: [6],
    produces: "PROMO_OFFER",
  },
};

/** Item types that must always be human-approved, regardless of autonomy. */
export const ALWAYS_APPROVAL_ITEM_TYPES: InboxItemType[] = [
  "AD_DRAFT",
  "EMAIL_FLOW",
  "PROMO_OFFER",
];
