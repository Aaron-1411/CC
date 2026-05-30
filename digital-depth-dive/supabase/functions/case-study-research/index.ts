const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, scrapedData, additionalContext } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating case study for:', url);

    const systemPrompt = `You are an elite brand strategist and growth researcher. Your task is to produce comprehensive, investment-grade case studies of brands based on their website content and any available public information.

You must be rigorous, specific, and evidence-based. Where you cannot verify information, clearly mark it as a hypothesis. Do not make up statistics or facts.

For each section, think like an analyst who needs to understand:
1. What game is this brand playing?
2. How do they actually make money?
3. What makes them hard to copy?
4. What can be learned and applied elsewhere?

Be specific with examples. Reference actual copy, headlines, and mechanics from the website when possible.`;

    const userPrompt = `Analyze this brand and create a comprehensive case study.

Website URL: ${url}

Website Content:
${scrapedData?.markdown || 'No content available'}

Website Metadata:
- Title: ${scrapedData?.metadata?.title || 'Unknown'}
- Description: ${scrapedData?.metadata?.description || 'Unknown'}

${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Generate a COMPLETE case study following this exact structure. Be thorough and specific. Use real examples from the website content where possible. Mark anything unverifiable as "[HYPOTHESIS]".

Return the case study in this JSON format:
{
  "brandName": "string",
  "inputs": {
    "brandName": "string",
    "websiteUrl": "string",
    "country": "string (inferred from website)",
    "category": "string",
    "coreProducts": "string",
    "businessModel": "DTC | Retail | Hybrid",
    "pricePoint": "£ | ££ | £££",
    "targetCustomer": "string",
    "whyWorthStudying": "string",
    "hypothesis": "string"
  },
  "framing": {
    "whatTheySell": "string (identity/status/confidence/relief/convenience/belonging/novelty/safety/performance)",
    "brandOrPerformanceLed": "Brand-led | Performance-led | Hybrid",
    "stage": "Small | Scaling | Large",
    "categoryStory": "string",
    "biggestConstraints": ["string"],
    "biggestAdvantages": ["string"]
  },
  "scaleSnapshot": {
    "trafficEstimate": "string",
    "topGeographies": ["string"],
    "channelMix": "string",
    "teamSignals": "string",
    "fundingSignals": "string",
    "retailPresence": "string",
    "partnerships": "string",
    "revenueProxy": {
      "range": "string",
      "method": "string",
      "uncertainty": "string",
      "confidence": "Low | Medium | High"
    }
  },
  "offerMechanics": {
    "corePromise": "string",
    "heroHeadline": "string",
    "primaryCta": "string",
    "entryProduct": "string",
    "coreProduct": "string",
    "premiumProduct": "string",
    "bundles": "string",
    "upsells": "string",
    "subscription": "string",
    "pricingArchitecture": "string",
    "offersUsed": ["string"],
    "buyingTrigger": "string",
    "mainObjections": ["string"],
    "objectionHandling": "string",
    "riskReversal": "string",
    "urgencySource": "string",
    "trustSignals": ["string"],
    "landingPageSystem": "string"
  },
  "paidMediaStrategy": {
    "channelRoles": {
      "meta": "string",
      "tiktok": "string",
      "google": "string",
      "youtube": "string",
      "other": "string"
    },
    "funnelMapping": {
      "tof": {
        "emotionsTargeted": ["string"],
        "coreNarratives": ["string"],
        "anglesUsed": ["string"],
        "formatsUsed": ["string"],
        "typicalCtas": ["string"]
      },
      "mof": {
        "proofTypes": ["string"],
        "educationDepth": "string",
        "comparisonFrames": ["string"],
        "typicalCtas": ["string"]
      },
      "bof": {
        "offerFraming": "string",
        "urgencyMechanics": ["string"],
        "retargetingPatterns": "string",
        "typicalCtas": ["string"]
      }
    },
    "creativeAngles": [{
      "angle": "string",
      "funnelStage": "string",
      "channel": "string",
      "emotionalDriver": "string",
      "proofUsed": "string",
      "cta": "string"
    }],
    "repeatedNarratives": ["string"],
    "absentAngles": ["string"],
    "creativeFormats": [{
      "format": "string",
      "platforms": ["string"],
      "funnelStage": "string",
      "notes": "string"
    }],
    "creativeVelocity": "Low | Medium | High",
    "mediaBuyingSignals": "string"
  },
  "organicSocialStrategy": {
    "platformRoles": {
      "instagram": "string",
      "tiktok": "string",
      "youtube": "string",
      "pinterest": "string",
      "email": "string",
      "founder": "string"
    },
    "contentPillars": [{
      "pillar": "string",
      "percentOfFeed": "string",
      "goal": "string",
      "notes": "string"
    }],
    "hookPatterns": ["string"],
    "visualIdentity": "string",
    "voiceStyle": "string",
    "founderVisibility": "High | Medium | Low",
    "founderRole": "string",
    "postingCadence": "string"
  },
  "influencerEngine": {
    "affiliateProgram": {
      "exists": "boolean",
      "platform": "string",
      "commissionRate": "string"
    },
    "creatorStrategy": {
      "density": "Low | Medium | High",
      "archetypes": ["string"],
      "contentStyle": "string"
    },
    "partnerships": ["string"],
    "distributionRisk": "string"
  },
  "whyTheyWin": {
    "primaryGrowthLever": "string",
    "secondaryLevers": ["string"],
    "hardToCopyAdvantages": ["string"],
    "moats": {
      "product": "string",
      "brand": "string",
      "distribution": "string",
      "operational": "string"
    },
    "weaknesses": ["string"],
    "whatBreaksIfCopied": "string"
  },
  "emulationPlan": {
    "whatToCopy": ["string"],
    "whatToAdapt": ["string"],
    "whatToAvoid": ["string"],
    "bestCategories": ["string"],
    "requiredConstraints": ["string"],
    "thirtyDayPlan": {
      "week1": ["string"],
      "week2": ["string"],
      "week3": ["string"],
      "week4": ["string"]
    }
  },
  "competitors": [{
    "name": "string",
    "url": "string",
    "positioning": "string",
    "strengths": ["string"],
    "weaknesses": ["string"],
    "differentiator": "string"
  }],
  "verificationLog": {
    "verifiedFacts": [{
      "fact": "string",
      "source": "string"
    }],
    "hypotheses": [{
      "hypothesis": "string",
      "evidenceNeeded": "string",
      "whereToCheck": "string"
    }]
  }
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [
          { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
        ],
      }),
    });

    if (!response.ok) {
      // Fallback to Lovable AI Gateway with Gemini
      console.log('Falling back to Gemini...');
      
      const geminiResponse = await fetch('https://api.lovable.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 8000,
          temperature: 0.3,
        }),
      });

      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.text();
        console.error('Gemini API error:', errorData);
        throw new Error('Failed to generate case study');
      }

      const geminiData = await geminiResponse.json();
      const content = geminiData.choices?.[0]?.message?.content || '';
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse case study response');
      }

      const caseStudy = JSON.parse(jsonMatch[0]);

      return new Response(
        JSON.stringify({ success: true, caseStudy }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse case study response');
    }

    const caseStudy = JSON.parse(jsonMatch[0]);

    console.log('Case study generated successfully');
    return new Response(
      JSON.stringify({ success: true, caseStudy }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating case study:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate case study';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
