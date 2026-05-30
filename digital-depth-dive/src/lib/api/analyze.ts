import { supabase } from '@/integrations/supabase/client';

export type AnalysisResult = {
  industry: {
    name: string;
    confidence: number;
    subCategory: string;
    marketSize?: string;
    competitivePosition?: string;
  };
  businessOffer: {
    mainProduct: string;
    valueProposition: string;
    targetAudience: string;
    pricingModel: string;
    differentiators?: string[];
    trustSignals?: string[];
  };
  effectiveness: {
    ux: {
      score: number;
      strengths: string[];
      weaknesses: string[];
      summary: string;
      mobileReadiness?: number;
      navigationClarity?: number;
    };
    visual: {
      score: number;
      strengths: string[];
      weaknesses: string[];
      summary: string;
      brandConsistency?: number;
      modernDesign?: number;
    };
    conversion: {
      score: number;
      ctaAnalysis: string;
      conversionElements: string[];
      missingElements: string[];
      summary: string;
      funnelClarity?: number;
      urgencyTactics?: string[];
    };
    communication: {
      score: number;
      clarity: number;
      strengths: string[];
      weaknesses: string[];
      summary: string;
      toneOfVoice?: string;
      contentQuality?: number;
    };
  };
  websiteCreator: {
    identified: boolean;
    name: string | null;
    evidence: string;
    platform: string | null;
    technologies?: string[];
  };
  lastUpdated: {
    estimated: string;
    evidence: string;
    confidence: string;
    contentFreshness?: string;
  };
  overallScore: number;
  topRecommendations: string[];
  // Extended enterprise fields
  technicalSeo?: any;
  accessibility?: any;
  aioOptimization?: any;
  security?: any;
  performanceIndicators?: any;
  executiveSummary?: string;
  topRecommendationsDetailed?: any[];
  competitorInsights?: any;
};

export type AnalyzeResponse = {
  success: boolean;
  error?: string;
  analysis?: AnalysisResult;
  metadata?: {
    title?: string;
    description?: string;
    sourceURL?: string;
  };
};

export const analyzeApi = {
  async analyze(scrapedData: unknown, url: string, competitors?: string[]): Promise<AnalyzeResponse> {
    const { data, error } = await supabase.functions.invoke('analyze-website', {
      body: { scrapedData, url, competitors },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
