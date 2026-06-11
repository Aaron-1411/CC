import type { AgentFn, AgentType } from "@/types/agents";
import { runIntelAgent } from "./intel.agent";
import { runContentAgent } from "./content.agent";
import { runSocialAgent } from "./social.agent";
import { runAdsAgent } from "./ads.agent";
import { runEmailAgent } from "./email.agent";
import { runReviewsAgent } from "./reviews.agent";
import { runPromoAgent } from "./promo.agent";

// Agents are added here as they're implemented. Anything not yet registered
// surfaces a clear message rather than a crash.
export const AGENT_REGISTRY: Partial<Record<AgentType, AgentFn>> = {
  INTEL: runIntelAgent,
  CONTENT: runContentAgent,
  SOCIAL: runSocialAgent,
  ADS: runAdsAgent,
  EMAIL: runEmailAgent,
  REVIEWS: runReviewsAgent,
  PROMO: runPromoAgent,
};

export function isAgentImplemented(type: AgentType): boolean {
  return Boolean(AGENT_REGISTRY[type]);
}

export function getAgentFn(type: AgentType): AgentFn {
  const fn = AGENT_REGISTRY[type];
  if (!fn) throw new Error(`The ${type.toLowerCase()} agent isn't available yet.`);
  return fn;
}
