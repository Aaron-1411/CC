// Shared schemas for deep competitor research. Split into 4 axes so we can
// run separate structured-extraction calls per axis (keeps each schema small
// enough for Gemini's constrained-decoding state limits).

import { z } from "zod";

const Evidence = z.object({
  value: z.string().optional().nullable(),
  confidence: z.enum(["high", "medium", "low"]).default("low"),
  source_url: z.string().optional().nullable(),
  evidence_quote: z.string().optional().nullable(),
});

export const PricingPlanSchema = z.object({
  name: z.string(),
  monthly_price: z.string().optional().nullable(),
  annual_price: z.string().optional().nullable(),
  per_seat_or_usage: z.string().optional().nullable(),
  included_quotas: z.string().optional().nullable(),
  addon_costs: z.string().optional().nullable(),
  target_user: z.string().optional().nullable(),
  source_url: z.string().optional().nullable(),
});

export const PricingProfileSchema = z.object({
  currency: z.string().optional().nullable(),
  tiers: z.array(PricingPlanSchema).default([]),
  free_trial: Evidence.optional(),
  money_back: Evidence.optional(),
  regional_pricing_notes: Evidence.optional(),
  discounts_promos: z.array(z.string()).default([]),
});

export const TermsProfileSchema = z.object({
  min_contract_length: Evidence.optional(),
  auto_renewal: Evidence.optional(),
  cancellation_notice: Evidence.optional(),
  payment_terms: Evidence.optional(),
  sla_uptime: Evidence.optional(),
  overage_rates: Evidence.optional(),
  enterprise_custom_terms_available: Evidence.optional(),
  refund_policy: Evidence.optional(),
});

export const CapabilityRowSchema = z.object({
  name: z.string(),
  classification: z.enum(["parity", "advantage", "gap", "unknown"]).default("unknown"),
  notes: z.string().optional().nullable(),
  source_url: z.string().optional().nullable(),
});

export const CapabilityProfileSchema = z.object({
  features: z.array(CapabilityRowSchema).default([]),
  integrations: z.array(z.string()).default([]),
  platforms: z.array(z.string()).default([]),
  limits: z.string().optional().nullable(),
  security_compliance: z.array(z.string()).default([]),
});

export const ProofPointSchema = z.object({
  type: z.enum(["logo", "case_study", "review_score", "award"]).default("logo"),
  label: z.string(),
  detail: z.string().optional().nullable(),
  source_url: z.string().optional().nullable(),
});

export const PositioningProfileSchema = z.object({
  tagline: z.string().optional().nullable(),
  target_segments: z.array(z.string()).default([]),
  differentiators: z.array(z.string()).default([]),
  proof_points: z.array(ProofPointSchema).default([]),
  incentives_active: z.array(z.string()).default([]),
  partner_ecosystem: z.array(z.string()).default([]),
});

export const CompetitorProfileSchema = z.object({
  name: z.string(),
  url: z.string().optional().nullable(),
  positioning_summary: z.string().optional().nullable(),
  pricing: PricingProfileSchema.optional(),
  terms: TermsProfileSchema.optional(),
  capabilities: CapabilityProfileSchema.optional(),
  positioning: PositioningProfileSchema.optional(),
  source_urls: z.array(z.string()).default([]),
  overall_confidence: z.enum(["high", "medium", "low"]).default("low"),
});

export type CompetitorProfile = z.infer<typeof CompetitorProfileSchema>;
export type PricingProfile = z.infer<typeof PricingProfileSchema>;
export type TermsProfile = z.infer<typeof TermsProfileSchema>;
export type CapabilityProfile = z.infer<typeof CapabilityProfileSchema>;
export type PositioningProfile = z.infer<typeof PositioningProfileSchema>;
