const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scrapedData, url, competitors } = await req.json();

    if (!scrapedData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Scraped data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapedData.data?.markdown || scrapedData.markdown || '';
    const html = scrapedData.data?.html || scrapedData.html || '';
    const links = scrapedData.data?.links || scrapedData.links || [];
    const metadata = scrapedData.data?.metadata || scrapedData.metadata || {};

    const systemPrompt = `You are an enterprise-grade website analyst. Analyze with precision and speed.
Focus areas: UX, CRO, Technical SEO, Accessibility, Security, AI Overview optimization.
Be specific, evidence-based, and actionable. Always respond with valid JSON.`;

    // Limit content for faster processing
    const maxMarkdown = 15000;
    const maxHtml = 6000;
    const truncatedMarkdown = markdown.slice(0, maxMarkdown);
    const truncatedHtml = html.slice(0, maxHtml);

    const hasCompetitors = competitors?.length > 0;

    const analysisPrompt = `Analyze this website comprehensively.

URL: ${url}
Title: ${metadata.title || 'Unknown'}
Description: ${metadata.description || 'N/A'}

CONTENT:
${truncatedMarkdown}

HTML:
${truncatedHtml}

INTERNAL LINKS: ${links.length}
${hasCompetitors ? `\nCOMPETITORS TO COMPARE: ${competitors.join(', ')}` : ''}

NUMBER OF INTERNAL LINKS: ${links.length}
${competitors?.length ? `\nCOMPETITOR URLS FOR COMPARISON: ${competitors.join(', ')}` : ''}

Return JSON format:
{
  "industry": { "name": "string", "confidence": "number 0-100", "subCategory": "string", "marketSize": "string", "competitivePosition": "leader/challenger/niche/emerging" },
  "businessOffer": { "mainProduct": "string", "valueProposition": "string", "targetAudience": "string", "pricingModel": "string", "differentiators": ["array"], "trustSignals": ["array"] },
  "effectiveness": {
    "ux": { "score": "0-100", "strengths": ["array"], "weaknesses": ["array"], "summary": "string", "mobileReadiness": "0-100", "navigationClarity": "0-100" },
    "visual": { "score": "0-100", "strengths": ["array"], "weaknesses": ["array"], "summary": "string", "brandConsistency": "0-100", "modernDesign": "0-100" },
    "conversion": { "score": "0-100", "ctaAnalysis": "string", "conversionElements": ["array"], "missingElements": ["array"], "summary": "string", "funnelClarity": "0-100", "urgencyTactics": ["array"] },
    "communication": { "score": "0-100", "clarity": "0-100", "strengths": ["array"], "weaknesses": ["array"], "summary": "string", "toneOfVoice": "string", "contentQuality": "0-100" }
  },
  "technicalSeo": {
    "score": "0-100",
    "titleTag": { "present": "boolean", "optimized": "boolean", "length": "number", "feedback": "string" },
    "metaDescription": { "present": "boolean", "optimized": "boolean", "length": "number", "feedback": "string" },
    "headingStructure": { "h1Count": "number", "hasProperHierarchy": "boolean", "feedback": "string" },
    "contentLength": { "wordCount": "number", "adequate": "boolean", "feedback": "string" },
    "internalLinking": { "count": "number", "quality": "string", "feedback": "string" },
    "schemaMarkup": { "detected": "boolean", "types": ["array"], "feedback": "string" },
    "imageOptimization": { "altTagsPresent": "boolean", "feedback": "string" }
  },
  "accessibility": { "score": "0-100", "issues": ["array"], "positives": ["array"], "feedback": "string" },
  "aioOptimization": { "score": "0-100", "strengths": ["array"], "improvements": ["array"], "contentStructure": "string", "authoritySignals": ["array"] },
  "security": { "score": "0-100", "httpsEnabled": "boolean", "privacyPolicy": "boolean", "cookieConsent": "boolean", "contactInfo": "boolean", "feedback": "string" },
  "websiteCreator": { "identified": "boolean", "name": "string|null", "evidence": "string", "platform": "string|null", "technologies": ["array"] },
  "lastUpdated": { "estimated": "string", "evidence": "string", "confidence": "low/medium/high", "contentFreshness": "string" },
  "performanceIndicators": { "estimatedLoadSpeed": "fast/moderate/slow", "contentDensity": "string", "thirdPartyScripts": "string", "feedback": "string" },
  "overallScore": "0-100 weighted: Conversion 30%, SEO 25%, UX 20%, Communication 15%, Visual 10%",
  "executiveSummary": "3-4 sentence high-level assessment",
  "topRecommendations": [{ "priority": "1-5", "category": "UX/SEO/Conversion/Content/Technical", "issue": "string", "recommendation": "string", "impact": "high/medium/low", "effort": "high/medium/low" }],
  "competitorInsights": { 
    "analyzed": "boolean", 
    "summary": "string - if competitors provided, analyze: positioning differences, feature gaps, messaging strengths/weaknesses, UX comparisons, pricing positioning. If no competitors, provide industry benchmark context",
    "competitorStrengths": ["array of competitor advantages if analyzed"],
    "opportunityGaps": ["array of areas where this site could improve vs competitors"]
  }
}

Tech detection hints: WordPress(wp-content), Shopify(cdn.shopify), Webflow(webflow.io), Squarespace(sqsp), Wix(wixstatic), Next.js(_next), React(data-reactroot), Vue(data-v-).
Be specific and actionable.`;

    console.log('Calling AI for analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.15,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    
    console.log('AI response received, parsing...');

    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw content:', content.slice(0, 500));
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse analysis results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure backward compatibility with old format
    if (analysis.topRecommendations && Array.isArray(analysis.topRecommendations)) {
      // Convert new format to old format for display compatibility
      if (typeof analysis.topRecommendations[0] === 'object') {
        analysis.topRecommendationsDetailed = analysis.topRecommendations;
        analysis.topRecommendations = analysis.topRecommendations.map((r: any) => 
          `[${r.priority}] ${r.category}: ${r.recommendation} (Impact: ${r.impact}, Effort: ${r.effort})`
        );
      }
    }

    console.log('Enterprise analysis complete');
    return new Response(
      JSON.stringify({ success: true, analysis, metadata }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error analyzing website:', error);
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
