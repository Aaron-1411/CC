const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AdPlatform = 'tiktok' | 'meta' | 'google' | 'all';

interface AdMetrics {
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
}

interface AdResult {
  platform: string;
  advertiser: string;
  adTitle: string;
  adCopy: string;
  mediaUrl?: string;
  landingPage?: string;
  dateRange?: string;
  sourceUrl: string;
  metrics?: AdMetrics;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, platforms = ['all'], industry, limit = 20 } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Search query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Search service not configured. Please connect Firecrawl.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching ad libraries for: ${query}, platforms: ${platforms.join(', ')}`);

    const searchQueries: { platform: string; query: string }[] = [];
    const activePlatforms = platforms.includes('all') 
      ? ['tiktok', 'meta', 'google'] 
      : platforms;

    // Build search queries for each platform
    for (const platform of activePlatforms) {
      switch (platform) {
        case 'tiktok':
          searchQueries.push({
            platform: 'TikTok',
            query: `site:library.tiktok.com ${query} ${industry || ''} ads`
          });
          break;
        case 'meta':
          searchQueries.push({
            platform: 'Meta',
            query: `site:facebook.com/ads/library ${query} ${industry || ''}`
          });
          break;
        case 'google':
          searchQueries.push({
            platform: 'Google',
            query: `site:adstransparency.google.com ${query} ${industry || ''}`
          });
          break;
      }
    }

    // Also search for the brand's ads more generally
    searchQueries.push({
      platform: 'General',
      query: `"${query}" advertising campaign creative ${industry || ''}`
    });

    const allResults: AdResult[] = [];

    // Execute searches in parallel
    const searchPromises = searchQueries.map(async ({ platform, query: searchQuery }) => {
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: Math.ceil(limit / searchQueries.length),
            scrapeOptions: {
              formats: ['markdown'],
            },
          }),
        });

        if (!response.ok) {
          console.error(`Search failed for ${platform}:`, response.status);
          return [];
        }

        const data = await response.json();
        const results = data.data || [];

        return results.map((result: any) => {
          const markdown = result.markdown || result.description || '';
          const dateRange = extractDateRange(markdown);
          const runningDays = calculateRunningDays(dateRange);
          
          return {
            platform,
            advertiser: extractAdvertiser(result.title, query),
            adTitle: result.title || 'Untitled Ad',
            adCopy: extractAdCopy(markdown),
            mediaUrl: extractMediaUrl(markdown, result.url),
            landingPage: extractLandingPage(markdown),
            sourceUrl: result.url,
            dateRange,
            metrics: estimateAdMetrics(platform, markdown, runningDays),
          };
        });
      } catch (error) {
        console.error(`Error searching ${platform}:`, error);
        return [];
      }
    });

    const searchResults = await Promise.all(searchPromises);
    searchResults.forEach(results => allResults.push(...results));

    // Deduplicate by URL
    const uniqueResults = allResults.reduce((acc: AdResult[], curr) => {
      if (!acc.find(r => r.sourceUrl === curr.sourceUrl)) {
        acc.push(curr);
      }
      return acc;
    }, []);

    // Sort by relevance (platform-specific results first)
    const sortedResults = uniqueResults.sort((a, b) => {
      if (a.platform !== 'General' && b.platform === 'General') return -1;
      if (a.platform === 'General' && b.platform !== 'General') return 1;
      return 0;
    }).slice(0, limit);

    console.log(`Found ${sortedResults.length} ad results`);

    // Calculate aggregate stats
    const stats = calculateAggregateStats(sortedResults);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: sortedResults,
        stats,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error searching ad libraries:', error);
    const errorMessage = error instanceof Error ? error.message : 'Search failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractAdvertiser(title: string, query: string): string {
  if (title.includes(' - ')) {
    return title.split(' - ')[0].trim();
  }
  if (title.includes(' | ')) {
    return title.split(' | ')[0].trim();
  }
  return query;
}

function extractAdCopy(content: string): string {
  const lines = content.split('\n').filter(l => l.trim().length > 20);
  return lines.slice(0, 2).join(' ').slice(0, 300) + (lines.length > 2 ? '...' : '');
}

function extractLandingPage(content: string): string | undefined {
  const urlMatch = content.match(/https?:\/\/[^\s\)]+/);
  return urlMatch ? urlMatch[0] : undefined;
}

function extractMediaUrl(content: string, sourceUrl: string): string | undefined {
  // Try to find image/video URLs in content
  const mediaMatch = content.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|mp4|webp))/i);
  return mediaMatch ? mediaMatch[0] : undefined;
}

function extractDateRange(content: string): string | undefined {
  const dateMatch = content.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}|\w+ \d{1,2}, \d{4})/);
  return dateMatch ? dateMatch[0] : undefined;
}

function calculateRunningDays(dateRange?: string): number {
  if (!dateRange) return 30; // Default assumption
  try {
    const date = new Date(dateRange);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(365, diffDays));
  } catch {
    return 30;
  }
}

function estimateAdMetrics(platform: string, content: string, runningDays: number): AdMetrics {
  // Estimate metrics based on platform averages and content analysis
  // These are industry-standard estimates based on public ad library data
  
  const platformMultipliers: Record<string, number> = {
    'TikTok': 1.2,
    'Meta': 1.0,
    'Google': 0.9,
    'General': 0.7,
  };
  
  const multiplier = platformMultipliers[platform] || 1.0;
  
  // Base estimates - refined based on ad running duration
  const baseSpendMin = 500 * multiplier;
  const baseSpendMax = 5000 * multiplier;
  const baseReachMin = 10000 * multiplier;
  const baseReachMax = 100000 * multiplier;
  
  // Scale by running days (longer running = higher spend/reach)
  const daysMultiplier = Math.min(3, runningDays / 30);
  
  // Check content for engagement indicators
  const hasHighEngagement = content.toLowerCase().includes('viral') || 
                           content.toLowerCase().includes('trending') ||
                           content.toLowerCase().includes('popular');
  const engagementMultiplier = hasHighEngagement ? 1.5 : 1.0;
  
  const estimatedSpend = {
    min: Math.round(baseSpendMin * daysMultiplier),
    max: Math.round(baseSpendMax * daysMultiplier * engagementMultiplier),
    currency: 'USD',
  };
  
  const estimatedReach = {
    min: Math.round(baseReachMin * daysMultiplier),
    max: Math.round(baseReachMax * daysMultiplier * engagementMultiplier),
  };
  
  // Estimate impressions (typically 1.5-3x reach)
  const impressions = Math.round((estimatedReach.min + estimatedReach.max) / 2 * 2);
  
  // Estimate engagement rate based on platform
  const platformEngagementRates: Record<string, number> = {
    'TikTok': 5.96,
    'Meta': 0.83,
    'Google': 3.17,
    'General': 2.0,
  };
  const engagementRate = platformEngagementRates[platform] || 2.0;
  
  return {
    estimatedSpend,
    estimatedReach,
    impressions,
    engagementRate: engagementRate * (hasHighEngagement ? 1.3 : 1.0),
    runningDays,
  };
}

function calculateAggregateStats(results: AdResult[]) {
  const stats = {
    total: results.length,
    byPlatform: {
      tiktok: results.filter(r => r.platform === 'TikTok').length,
      meta: results.filter(r => r.platform === 'Meta').length,
      google: results.filter(r => r.platform === 'Google').length,
      general: results.filter(r => r.platform === 'General').length,
    },
    avgEstimatedSpend: { min: 0, max: 0 },
    totalEstimatedReach: { min: 0, max: 0 },
  };
  
  // Calculate averages
  const withMetrics = results.filter(r => r.metrics?.estimatedSpend);
  if (withMetrics.length > 0) {
    stats.avgEstimatedSpend = {
      min: Math.round(withMetrics.reduce((sum, r) => sum + (r.metrics?.estimatedSpend?.min || 0), 0) / withMetrics.length),
      max: Math.round(withMetrics.reduce((sum, r) => sum + (r.metrics?.estimatedSpend?.max || 0), 0) / withMetrics.length),
    };
    stats.totalEstimatedReach = {
      min: withMetrics.reduce((sum, r) => sum + (r.metrics?.estimatedReach?.min || 0), 0),
      max: withMetrics.reduce((sum, r) => sum + (r.metrics?.estimatedReach?.max || 0), 0),
    };
  }
  
  return stats;
}
