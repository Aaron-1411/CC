const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KeyFeature {
  id: string;
  feature: string;
}

interface USP {
  id: string;
  point: string;
}

interface CustomerPersona {
  id: string;
  name: string;
  demographics: string;
  painPoints: string[];
  motivations: string[];
}

interface MarketingAngle {
  id: string;
  angle: string;
  hook: string;
  targetEmotion: string;
}

interface BrandAnalysis {
  productOverview: {
    name: string;
    type: string;
    description: string;
    category: string;
  };
  keyFeatures: KeyFeature[];
  uniqueSellingPoints: USP[];
  customerPersonas: CustomerPersona[];
  marketingAngles: MarketingAngle[];
  branding: {
    colorScheme: string;
    tone: string;
    style: string;
    primaryColors: string[];
  };
  competitiveAdvantages: string[];
}

interface GeneratedAd {
  platform: string;
  format: string;
  headline: string;
  primaryText: string;
  callToAction: string;
  hook: string;
  targetPersona: string;
  marketingAngle: string;
  imagePrompt: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { step = 'analyze', url, brandAnalysis, selectedInsights, platforms = ['tiktok', 'meta', 'google'], savedAdsForInspo = [] } = body;

    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // STEP 1: Analyze the website
    if (step === 'analyze') {
      if (!url) {
        return new Response(
          JSON.stringify({ success: false, error: 'URL is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!FIRECRAWL_API_KEY) {
        return new Response(
          JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Format URL
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`;
      }

      console.log('Step 1: Scraping website for brand analysis:', formattedUrl);

      // Scrape the website with branding and content
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: formattedUrl,
          formats: ['markdown', 'branding'],
          onlyMainContent: true,
        }),
      });

      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.text();
        console.error('Firecrawl error:', errorData);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to scrape website' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const scrapeData = await scrapeResponse.json();
      const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
      const branding = scrapeData.data?.branding || scrapeData.branding || {};
      const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

      console.log('Website scraped, analyzing brand...');

      // Analyze the brand using AI
      const analysisPrompt = `Analyze this website content and branding to create a comprehensive marketing brief.

WEBSITE CONTENT:
${markdown.slice(0, 8000)}

BRANDING DATA:
${JSON.stringify(branding, null, 2)}

METADATA:
Title: ${metadata.title || 'Unknown'}
Description: ${metadata.description || 'No description'}

Analyze and extract:
1. Product/Service Overview - what they sell, category, core offering
2. Key Features - main product/service features (5-8 features, each as a concise phrase)
3. Unique Selling Points - what makes them different (3-5 compelling points)
4. Customer Personas - 2-3 ideal customer profiles with demographics, pain points, motivations
5. Marketing Angles - 4-6 different angles to promote this (emotional, logical, social proof, urgency, etc.) with example hooks
6. Brand Voice & Style - tone, personality, visual style
7. Competitive Advantages - what they do better than alternatives

IMPORTANT: Generate unique IDs for each feature, USP, persona, and angle (use format like "feat_1", "usp_1", "persona_1", "angle_1").`;

      const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert marketing strategist and copywriter. Analyze brands and create detailed marketing briefs. Always generate unique IDs for items.' 
            },
            { role: 'user', content: analysisPrompt }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'create_brand_analysis',
              description: 'Create a structured brand analysis with IDs for selection',
              parameters: {
                type: 'object',
                properties: {
                  productOverview: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      type: { type: 'string' },
                      description: { type: 'string' },
                      category: { type: 'string' }
                    },
                    required: ['name', 'type', 'description', 'category']
                  },
                  keyFeatures: { 
                    type: 'array', 
                    items: { 
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        feature: { type: 'string' }
                      },
                      required: ['id', 'feature']
                    } 
                  },
                  uniqueSellingPoints: { 
                    type: 'array', 
                    items: { 
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        point: { type: 'string' }
                      },
                      required: ['id', 'point']
                    } 
                  },
                  customerPersonas: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        demographics: { type: 'string' },
                        painPoints: { type: 'array', items: { type: 'string' } },
                        motivations: { type: 'array', items: { type: 'string' } }
                      },
                      required: ['id', 'name', 'demographics', 'painPoints', 'motivations']
                    }
                  },
                  marketingAngles: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        angle: { type: 'string' },
                        hook: { type: 'string' },
                        targetEmotion: { type: 'string' }
                      },
                      required: ['id', 'angle', 'hook', 'targetEmotion']
                    }
                  },
                  branding: {
                    type: 'object',
                    properties: {
                      colorScheme: { type: 'string' },
                      tone: { type: 'string' },
                      style: { type: 'string' },
                      primaryColors: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['colorScheme', 'tone', 'style', 'primaryColors']
                  },
                  competitiveAdvantages: { type: 'array', items: { type: 'string' } }
                },
                required: ['productOverview', 'keyFeatures', 'uniqueSellingPoints', 'customerPersonas', 'marketingAngles', 'branding', 'competitiveAdvantages']
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'create_brand_analysis' } }
        }),
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error('AI analysis error:', errorText);
        
        if (analysisResponse.status === 429) {
          return new Response(
            JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (analysisResponse.status === 402) {
          return new Response(
            JSON.stringify({ success: false, error: 'AI credits exhausted. Please add credits to continue.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to analyze brand' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const analysisData = await analysisResponse.json();
      const toolCall = analysisData.choices?.[0]?.message?.tool_calls?.[0];
      
      let parsedAnalysis: BrandAnalysis;
      try {
        parsedAnalysis = JSON.parse(toolCall?.function?.arguments || '{}');
      } catch (e) {
        console.error('Failed to parse brand analysis:', e);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to parse brand analysis' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Brand analysis complete');

      return new Response(
        JSON.stringify({
          success: true,
          brandAnalysis: parsedAnalysis,
          scrapedBranding: branding,
          metadata: {
            title: metadata.title,
            description: metadata.description,
            url: formattedUrl
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // STEP 2: Generate ads based on selected insights
    if (step === 'generate') {
      if (!brandAnalysis || !selectedInsights) {
        return new Response(
          JSON.stringify({ success: false, error: 'Brand analysis and selected insights are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Step 2: Generating ads based on selections...');

      // Filter brand analysis based on selections
      const selectedFeatures = brandAnalysis.keyFeatures
        .filter((f: KeyFeature) => selectedInsights.features.includes(f.id))
        .map((f: KeyFeature) => f.feature);
      
      const selectedUSPs = brandAnalysis.uniqueSellingPoints
        .filter((u: USP) => selectedInsights.usps.includes(u.id))
        .map((u: USP) => u.point);
      
      const selectedPersonas = brandAnalysis.customerPersonas
        .filter((p: CustomerPersona) => selectedInsights.personas.includes(p.id));
      
      const selectedAngles = brandAnalysis.marketingAngles
        .filter((a: MarketingAngle) => selectedInsights.angles.includes(a.id));

      // Build inspiration context from saved ads
      const inspoContext = savedAdsForInspo.length > 0 
        ? `\n\nINSPIRATION ADS TO REFERENCE (incorporate similar styles, hooks, and angles):\n${savedAdsForInspo.map((ad: any, i: number) => 
            `${i + 1}. [${ad.platform}] ${ad.advertiser}: "${ad.adTitle}" - ${ad.adCopy}`
          ).join('\n')}`
        : '';

      const adGenPrompt = `Generate compelling A/B test ad variants for each platform based on these SPECIFICALLY SELECTED brand elements.

PRODUCT: ${brandAnalysis.productOverview.name} (${brandAnalysis.productOverview.type})
${brandAnalysis.productOverview.description}

SELECTED KEY FEATURES TO HIGHLIGHT:
${selectedFeatures.map((f: string, i: number) => `${i + 1}. ${f}`).join('\n')}

SELECTED UNIQUE SELLING POINTS TO EMPHASIZE:
${selectedUSPs.map((u: string, i: number) => `${i + 1}. ${u}`).join('\n')}

SELECTED TARGET PERSONAS:
${selectedPersonas.map((p: CustomerPersona) => `- ${p.name}: ${p.demographics}
  Pain Points: ${p.painPoints.join(', ')}
  Motivations: ${p.motivations.join(', ')}`).join('\n\n')}

SELECTED MARKETING ANGLES TO USE:
${selectedAngles.map((a: MarketingAngle) => `- ${a.angle} (${a.targetEmotion}): "${a.hook}"`).join('\n')}

BRAND VOICE: ${brandAnalysis.branding.tone}, ${brandAnalysis.branding.style}
${inspoContext}

Generate 3 ads per platform (${platforms.join(', ')}) with A/B VARIANTS for testing. Each ad MUST:
- Use one of the SELECTED marketing angles
- Target one of the SELECTED personas
- Highlight at least one SELECTED feature or USP
- Include a strong hook that grabs attention
- Have a clear call-to-action
- Include an AI image prompt for the ad visual
- Include a variant label (A, B, or C) for A/B testing
- Include an estimated engagement score (1-100) based on the hook and copy quality

For each platform, create:
- Variant A: Direct/benefit-focused approach
- Variant B: Story/emotional approach  
- Variant C: Problem-agitation-solution approach

Platform guidelines:
- TikTok: Casual, trendy, hook-first, 150 chars max for primary text
- Meta (FB/IG): Conversational, benefit-focused, 125-250 chars
- Google: Direct, keyword-rich, under 90 chars headline, 180 chars description`;

      const adsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert ad copywriter who creates high-converting ads for major platforms. Always use the specifically selected elements provided.' 
            },
            { role: 'user', content: adGenPrompt }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'generate_ads',
              description: 'Generate platform-specific A/B test ads',
              parameters: {
                type: 'object',
                properties: {
                  ads: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        platform: { type: 'string' },
                        format: { type: 'string' },
                        headline: { type: 'string' },
                        primaryText: { type: 'string' },
                        callToAction: { type: 'string' },
                        hook: { type: 'string' },
                        targetPersona: { type: 'string' },
                        marketingAngle: { type: 'string' },
                        imagePrompt: { type: 'string', description: 'A detailed prompt for generating an AI image for this ad' },
                        variant: { type: 'string', description: 'A/B test variant label (A, B, or C)' },
                        estimatedEngagement: { type: 'number', description: 'Estimated engagement score 1-100' },
                        hookType: { type: 'string', description: 'Type of hook: question, statistic, story, problem, benefit' }
                      },
                      required: ['platform', 'format', 'headline', 'primaryText', 'callToAction', 'hook', 'targetPersona', 'marketingAngle', 'imagePrompt', 'variant', 'estimatedEngagement', 'hookType']
                    }
                  }
                },
                required: ['ads']
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'generate_ads' } }
        }),
      });

      if (!adsResponse.ok) {
        console.error('Ad generation error');
        return new Response(
          JSON.stringify({ success: false, error: 'Ad generation failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const adsData = await adsResponse.json();
      const adsToolCall = adsData.choices?.[0]?.message?.tool_calls?.[0];
      
      let generatedAds: GeneratedAd[] = [];
      try {
        const parsed = JSON.parse(adsToolCall?.function?.arguments || '{}');
        generatedAds = parsed.ads || [];
      } catch (e) {
        console.error('Failed to parse ads:', e);
      }

      console.log(`Generated ${generatedAds.length} ads`);

      return new Response(
        JSON.stringify({
          success: true,
          generatedAds,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid step parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-ads:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
