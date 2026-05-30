import { supabase } from '@/integrations/supabase/client';

export interface ProductOverview {
  name: string;
  type: string;
  description: string;
  category: string;
}

export interface CustomerPersona {
  id: string;
  name: string;
  demographics: string;
  painPoints: string[];
  motivations: string[];
}

export interface MarketingAngle {
  id: string;
  angle: string;
  hook: string;
  targetEmotion: string;
}

export interface BrandingInfo {
  colorScheme: string;
  tone: string;
  style: string;
  primaryColors: string[];
}

export interface KeyFeature {
  id: string;
  feature: string;
}

export interface USP {
  id: string;
  point: string;
}

export interface BrandAnalysis {
  productOverview: ProductOverview;
  keyFeatures: KeyFeature[];
  uniqueSellingPoints: USP[];
  customerPersonas: CustomerPersona[];
  marketingAngles: MarketingAngle[];
  branding: BrandingInfo;
  competitiveAdvantages: string[];
}

export interface GeneratedAd {
  platform: string;
  format: string;
  headline: string;
  primaryText: string;
  callToAction: string;
  hook: string;
  targetPersona: string;
  marketingAngle: string;
  imagePrompt?: string;
  variant?: string;
  estimatedEngagement?: number;
  hookType?: string;
}

export interface SavedAdForInspo {
  platform: string;
  advertiser: string;
  adTitle: string;
  adCopy: string;
}

export interface AdGeneratorAnalyzeResponse {
  success: boolean;
  error?: string;
  brandAnalysis?: BrandAnalysis;
  scrapedBranding?: any;
  metadata?: {
    title: string;
    description: string;
    url: string;
  };
}

export interface AdGeneratorGenerateResponse {
  success: boolean;
  error?: string;
  generatedAds?: GeneratedAd[];
}

export interface SelectedInsights {
  features: string[];
  usps: string[];
  personas: string[];
  angles: string[];
}

export const adGeneratorApi = {
  // Step 1: Analyze the website and return brand insights
  async analyze(params: {
    url: string;
  }): Promise<AdGeneratorAnalyzeResponse> {
    const { data, error } = await supabase.functions.invoke('generate-ads', {
      body: { 
        url: params.url,
        step: 'analyze',
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Step 2: Generate ads based on selected insights
  async generate(params: {
    brandAnalysis: BrandAnalysis;
    selectedInsights: SelectedInsights;
    platforms: string[];
    savedAdsForInspo?: SavedAdForInspo[];
  }): Promise<AdGeneratorGenerateResponse> {
    const { data, error } = await supabase.functions.invoke('generate-ads', {
      body: {
        step: 'generate',
        brandAnalysis: params.brandAnalysis,
        selectedInsights: params.selectedInsights,
        platforms: params.platforms,
        savedAdsForInspo: params.savedAdsForInspo || [],
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
