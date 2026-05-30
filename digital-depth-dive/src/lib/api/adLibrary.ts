import { supabase } from '@/integrations/supabase/client';

export type AdPlatform = 'tiktok' | 'meta' | 'google' | 'all';

export type AdMetrics = {
  estimatedSpend?: {
    min: number;
    max: number;
    currency: string;
  };
  estimatedReach?: {
    min: number;
    max: number;
  };
  impressions?: number;
  engagementRate?: number;
  runningDays?: number;
};

export type AdResult = {
  platform: string;
  advertiser: string;
  adTitle: string;
  adCopy: string;
  mediaUrl?: string;
  landingPage?: string;
  dateRange?: string;
  sourceUrl: string;
  metrics?: AdMetrics;
};

export type AdSearchStats = {
  total: number;
  byPlatform: {
    tiktok: number;
    meta: number;
    google: number;
    general: number;
  };
  avgEstimatedSpend?: {
    min: number;
    max: number;
  };
  totalEstimatedReach?: {
    min: number;
    max: number;
  };
};

type AdSearchResponse = {
  success: boolean;
  error?: string;
  results?: AdResult[];
  stats?: AdSearchStats;
};

export const adLibraryApi = {
  async search(params: {
    query: string;
    platforms?: AdPlatform[];
    industry?: string;
    limit?: number;
  }): Promise<AdSearchResponse> {
    const { data, error } = await supabase.functions.invoke('search-ad-libraries', {
      body: params,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
