import { supabase } from '@/integrations/supabase/client';
import { ScrapeData } from '@/lib/api/firecrawl';

export type CaseStudyInputs = {
  brandName: string;
  websiteUrl: string;
  country: string;
  category: string;
  coreProducts: string;
  businessModel: 'DTC' | 'Retail' | 'Hybrid';
  pricePoint: '£' | '££' | '£££';
  targetCustomer: string;
  whyWorthStudying: string;
  hypothesis: string;
};

export type CaseStudyFraming = {
  whatTheySell: string;
  brandOrPerformanceLed: 'Brand-led' | 'Performance-led' | 'Hybrid';
  stage: 'Small' | 'Scaling' | 'Large';
  categoryStory: string;
  biggestConstraints: string[];
  biggestAdvantages: string[];
};

export type RevenueProxy = {
  range: string;
  method: string;
  uncertainty: string;
  confidence: 'Low' | 'Medium' | 'High';
};

export type ScaleSnapshot = {
  trafficEstimate: string;
  topGeographies: string[];
  channelMix: string;
  teamSignals: string;
  fundingSignals: string;
  retailPresence: string;
  partnerships: string;
  revenueProxy: RevenueProxy;
};

export type OfferMechanics = {
  corePromise: string;
  heroHeadline: string;
  primaryCta: string;
  entryProduct: string;
  coreProduct: string;
  premiumProduct: string;
  bundles: string;
  upsells: string;
  subscription: string;
  pricingArchitecture: string;
  offersUsed: string[];
  buyingTrigger: string;
  mainObjections: string[];
  objectionHandling: string;
  riskReversal: string;
  urgencySource: string;
  trustSignals: string[];
  landingPageSystem: string;
};

export type FunnelStage = {
  emotionsTargeted?: string[];
  coreNarratives?: string[];
  anglesUsed?: string[];
  formatsUsed?: string[];
  proofTypes?: string[];
  educationDepth?: string;
  comparisonFrames?: string[];
  offerFraming?: string;
  urgencyMechanics?: string[];
  retargetingPatterns?: string;
  typicalCtas: string[];
};

export type CreativeAngle = {
  angle: string;
  funnelStage: string;
  channel: string;
  emotionalDriver: string;
  proofUsed: string;
  cta: string;
};

export type CreativeFormat = {
  format: string;
  platforms: string[];
  funnelStage: string;
  notes: string;
};

export type PaidMediaStrategy = {
  channelRoles: {
    meta: string;
    tiktok: string;
    google: string;
    youtube: string;
    other: string;
  };
  funnelMapping: {
    tof: FunnelStage;
    mof: FunnelStage;
    bof: FunnelStage;
  };
  creativeAngles: CreativeAngle[];
  repeatedNarratives: string[];
  absentAngles: string[];
  creativeFormats: CreativeFormat[];
  creativeVelocity: 'Low' | 'Medium' | 'High';
  mediaBuyingSignals: string;
};

export type ContentPillar = {
  pillar: string;
  percentOfFeed: string;
  goal: string;
  notes: string;
};

export type OrganicSocialStrategy = {
  platformRoles: {
    instagram: string;
    tiktok: string;
    youtube: string;
    pinterest: string;
    email: string;
    founder: string;
  };
  contentPillars: ContentPillar[];
  hookPatterns: string[];
  visualIdentity: string;
  voiceStyle: string;
  founderVisibility: 'High' | 'Medium' | 'Low';
  founderRole: string;
  postingCadence: string;
};

export type InfluencerEngine = {
  affiliateProgram: {
    exists: boolean;
    platform: string;
    commissionRate: string;
  };
  creatorStrategy: {
    density: 'Low' | 'Medium' | 'High';
    archetypes: string[];
    contentStyle: string;
  };
  partnerships: string[];
  distributionRisk: string;
};

export type WhyTheyWin = {
  primaryGrowthLever: string;
  secondaryLevers: string[];
  hardToCopyAdvantages: string[];
  moats: {
    product: string;
    brand: string;
    distribution: string;
    operational: string;
  };
  weaknesses: string[];
  whatBreaksIfCopied: string;
};

export type EmulationPlan = {
  whatToCopy: string[];
  whatToAdapt: string[];
  whatToAvoid: string[];
  bestCategories: string[];
  requiredConstraints: string[];
  thirtyDayPlan: {
    week1: string[];
    week2: string[];
    week3: string[];
    week4: string[];
  };
};

export type Competitor = {
  name: string;
  url: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  differentiator: string;
};

export type VerificationLog = {
  verifiedFacts: Array<{ fact: string; source: string }>;
  hypotheses: Array<{ hypothesis: string; evidenceNeeded: string; whereToCheck: string }>;
};

export type CaseStudy = {
  brandName: string;
  inputs: CaseStudyInputs;
  framing: CaseStudyFraming;
  scaleSnapshot: ScaleSnapshot;
  offerMechanics: OfferMechanics;
  paidMediaStrategy: PaidMediaStrategy;
  organicSocialStrategy: OrganicSocialStrategy;
  influencerEngine: InfluencerEngine;
  whyTheyWin: WhyTheyWin;
  emulationPlan: EmulationPlan;
  competitors: Competitor[];
  verificationLog: VerificationLog;
};

export type CaseStudyResponse = {
  success: boolean;
  error?: string;
  caseStudy?: CaseStudy;
};

export const caseStudyApi = {
  async generate(url: string, scrapedData: ScrapeData, additionalContext?: string): Promise<CaseStudyResponse> {
    const { data, error } = await supabase.functions.invoke('case-study-research', {
      body: { url, scrapedData, additionalContext },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
