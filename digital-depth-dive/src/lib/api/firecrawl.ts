import { supabase } from '@/integrations/supabase/client';

export type ScrapeData = {
  markdown?: string;
  html?: string;
  links?: string[];
  screenshot?: string;
  branding?: {
    colors?: {
      primary?: string;
      secondary?: string;
      accent?: string;
      background?: string;
      textPrimary?: string;
    };
    fonts?: Array<{ family?: string }>;
    typography?: {
      fontFamilies?: {
        primary?: string;
      };
    };
    images?: {
      logo?: string;
    };
    logo?: string;
  };
  metadata?: {
    title?: string;
    description?: string;
    sourceURL?: string;
  };
};

type FirecrawlResponse<T = ScrapeData> = {
  success: boolean;
  error?: string;
  data?: T;
};

type MapResponse = {
  success: boolean;
  error?: string;
  links?: string[];
};

type ScrapeOptions = {
  formats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot' | 'branding')[];
  onlyMainContent?: boolean;
  waitFor?: number;
};

type MapOptions = {
  search?: string;
  limit?: number;
  includeSubdomains?: boolean;
};

export const firecrawlApi = {
  async scrape(url: string, options?: ScrapeOptions): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { url, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  async map(url: string, options?: MapOptions): Promise<MapResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-map', {
      body: { url, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
