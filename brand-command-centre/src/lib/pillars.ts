import type { PillarDefinition } from "@/types/analysis";

// The 13-pillar gap-analysis rubric. IDs are stable and referenced by the
// agents (e.g. Pillar 02 = SEO triggers the Content agent).
export const PILLARS: PillarDefinition[] = [
  {
    id: 1,
    key: "brand_positioning",
    name: "Brand & Positioning",
    category: "Foundations",
    description:
      "Clarity of the brand promise, differentiation, and consistency of message across the homepage and key pages.",
    whatGoodLooksLike:
      "A sharp, memorable value proposition above the fold; consistent voice; a clear reason to choose this brand over alternatives.",
    recommendedAgents: ["INTEL"],
  },
  {
    id: 2,
    key: "seo",
    name: "SEO & Organic Search",
    category: "Acquisition",
    description:
      "Technical SEO health, keyword coverage, content depth, and ability to rank for commercial-intent terms.",
    whatGoodLooksLike:
      "Indexed, fast pages; a content hub targeting commercial keywords; rich metadata and internal linking.",
    recommendedAgents: ["CONTENT"],
  },
  {
    id: 3,
    key: "google_ads",
    name: "Google Ads / Paid Search",
    category: "Acquisition",
    description:
      "Presence and quality of paid search — branded defence, high-intent non-brand terms, and ad copy strength.",
    whatGoodLooksLike:
      "Branded coverage, tightly themed ad groups on high-intent keywords, and compelling, benefit-led copy.",
    recommendedAgents: ["ADS"],
  },
  {
    id: 4,
    key: "meta_ads",
    name: "Meta Ads / Paid Social",
    category: "Acquisition",
    description:
      "Use of Meta (Facebook/Instagram) advertising — creative variety, audience strategy, and funnel coverage.",
    whatGoodLooksLike:
      "Multiple creative angles, prospecting + retargeting audiences, and a clear offer in the hook.",
    recommendedAgents: ["ADS"],
  },
  {
    id: 5,
    key: "ux_conversion",
    name: "Website UX & Conversion",
    category: "Conversion",
    description:
      "Site usability, page speed, mobile experience, and the friction between landing and checkout.",
    whatGoodLooksLike:
      "Fast, frictionless mobile-first journeys; clear CTAs; trust signals and a streamlined checkout.",
    recommendedAgents: ["CONTENT"],
  },
  {
    id: 6,
    key: "offer_pricing",
    name: "Offer & Pricing",
    category: "Conversion",
    description:
      "Strength of the offer, pricing perception, bundles, shipping thresholds, and promotional cadence.",
    whatGoodLooksLike:
      "Compelling offers, smart free-shipping thresholds, bundles, and a planned (not reactive) promo calendar.",
    recommendedAgents: ["PROMO"],
  },
  {
    id: 7,
    key: "email_crm",
    name: "Email & CRM / Lifecycle",
    category: "Retention",
    description:
      "Lifecycle automation — welcome, abandoned cart, back-in-stock, post-purchase and win-back flows.",
    whatGoodLooksLike:
      "All core flows live and earning; segmented broadcasts; healthy list growth and capture.",
    recommendedAgents: ["EMAIL"],
  },
  {
    id: 8,
    key: "organic_social",
    name: "Organic Social",
    category: "Brand",
    description:
      "Consistency, native format use, and engagement quality across the brand's organic social channels.",
    whatGoodLooksLike:
      "Consistent posting cadence, platform-native formats, a recognisable voice and genuine engagement.",
    recommendedAgents: ["SOCIAL"],
  },
  {
    id: 9,
    key: "content_storytelling",
    name: "Content & Storytelling",
    category: "Brand",
    description:
      "Depth and quality of editorial, product storytelling, and educational content that builds trust.",
    whatGoodLooksLike:
      "A library of useful, on-brand content that answers buyer questions and supports SEO and social.",
    recommendedAgents: ["CONTENT"],
  },
  {
    id: 10,
    key: "analytics_tracking",
    name: "Analytics & Tracking",
    category: "Foundations",
    description:
      "Measurement maturity — analytics, conversion tracking, pixels, and attribution readiness.",
    whatGoodLooksLike:
      "Clean GA4, server-side/pixel tracking, event coverage, and the ability to attribute spend to revenue.",
    recommendedAgents: ["INTEL"],
  },
  {
    id: 11,
    key: "cx_support",
    name: "Customer Experience & Support",
    category: "Retention",
    description:
      "Pre- and post-purchase support — FAQs, help content, response times, and self-service.",
    whatGoodLooksLike:
      "Fast, helpful support; comprehensive FAQs; proactive comms; low-effort returns and tracking.",
    recommendedAgents: ["EMAIL"],
  },
  {
    id: 12,
    key: "reviews_reputation",
    name: "Reviews & Reputation",
    category: "Trust",
    description:
      "Volume, visibility, and management of reviews across Trustpilot, Google and product pages.",
    whatGoodLooksLike:
      "Plentiful, recent reviews surfaced on-site; active responses to all reviews; a review-generation engine.",
    recommendedAgents: ["REVIEWS"],
  },
  {
    id: 13,
    key: "competitive_intel",
    name: "Competitive Positioning",
    category: "Market",
    description:
      "Awareness of competitor moves, pricing, promotions and share-of-voice in the category.",
    whatGoodLooksLike:
      "A live read on competitor activity that informs content, ads, promo and pricing decisions.",
    recommendedAgents: ["INTEL"],
  },
];

export const PILLAR_COUNT = PILLARS.length;

export function getPillar(id: number): PillarDefinition | undefined {
  return PILLARS.find((p) => p.id === id);
}
