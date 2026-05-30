const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VisibilityResult {
  overallScore: number;
  aiCrawlerReadiness: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  llmMentionPotential: {
    score: number;
    brandMentionability: string;
    topicalAuthority: string[];
    contentCitability: number;
  };
  structuredData: {
    hasSchema: boolean;
    schemaTypes: string[];
    score: number;
    recommendations: string[];
  };
  contentOptimization: {
    score: number;
    factualClaims: number;
    citableSentences: number;
    entityCoverage: string[];
    recommendations: string[];
  };
  technicalReadiness: {
    hasRobotsTxt: boolean;
    allowsAICrawlers: boolean;
    hasSitemap: boolean;
    loadSpeed: string;
    mobileOptimized: boolean;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, scrapedContent } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing AI visibility for: ${url}`);

    // Analyze the content for AI visibility factors
    const content = scrapedContent?.markdown || '';
    const html = scrapedContent?.html || '';
    
    // Check for structured data
    const hasJsonLd = html.includes('application/ld+json');
    const schemaTypes = extractSchemaTypes(html);
    
    // Check for robots.txt indicators
    const hasRobotsMeta = html.includes('robots');
    
    // Analyze content quality for AI
    const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 20);
    const factualClaims = sentences.filter((s: string) => 
      /\d+%|\d+ (percent|million|billion|thousand)|according to|study|research|data shows/i.test(s)
    ).length;
    
    const citableSentences = sentences.filter((s: string) => 
      s.trim().length > 50 && 
      !/click here|learn more|sign up|buy now/i.test(s)
    ).length;

    // Extract entities and topics
    const entities = extractEntities(content);
    
    // Calculate scores
    const structuredDataScore = calculateStructuredDataScore(hasJsonLd, schemaTypes);
    const contentScore = calculateContentScore(factualClaims, citableSentences, sentences.length);
    const technicalScore = calculateTechnicalScore(html);
    const brandMentionScore = calculateBrandMentionScore(content);
    
    const overallScore = Math.round(
      (structuredDataScore * 0.25) +
      (contentScore * 0.35) +
      (technicalScore * 0.2) +
      (brandMentionScore * 0.2)
    );

    const result: VisibilityResult = {
      overallScore,
      aiCrawlerReadiness: {
        score: technicalScore,
        issues: getTechnicalIssues(html),
        recommendations: getTechnicalRecommendations(html),
      },
      llmMentionPotential: {
        score: brandMentionScore,
        brandMentionability: getBrandMentionability(brandMentionScore),
        topicalAuthority: entities.slice(0, 5),
        contentCitability: Math.round((citableSentences / Math.max(1, sentences.length)) * 100),
      },
      structuredData: {
        hasSchema: hasJsonLd,
        schemaTypes,
        score: structuredDataScore,
        recommendations: getSchemaRecommendations(hasJsonLd, schemaTypes),
      },
      contentOptimization: {
        score: contentScore,
        factualClaims,
        citableSentences,
        entityCoverage: entities,
        recommendations: getContentRecommendations(factualClaims, citableSentences),
      },
      technicalReadiness: {
        hasRobotsTxt: hasRobotsMeta,
        allowsAICrawlers: !html.includes('noai') && !html.includes('noindex'),
        hasSitemap: html.includes('sitemap'),
        loadSpeed: 'Good',
        mobileOptimized: html.includes('viewport'),
      },
    };

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI visibility check error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractSchemaTypes(html: string): string[] {
  const types: string[] = [];
  const schemaMatches = html.matchAll(/"@type"\s*:\s*"([^"]+)"/g);
  for (const match of schemaMatches) {
    if (!types.includes(match[1])) {
      types.push(match[1]);
    }
  }
  return types;
}

function extractEntities(content: string): string[] {
  const words = content.split(/\s+/);
  const capitalizedPhrases = new Map<string, number>();
  
  for (let i = 0; i < words.length - 1; i++) {
    const word = words[i].replace(/[^a-zA-Z]/g, '');
    if (word.length > 3 && word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
      const count = capitalizedPhrases.get(word) || 0;
      capitalizedPhrases.set(word, count + 1);
    }
  }
  
  return Array.from(capitalizedPhrases.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function calculateStructuredDataScore(hasJsonLd: boolean, schemaTypes: string[]): number {
  let score = 30; // Base score
  if (hasJsonLd) score += 40;
  score += Math.min(30, schemaTypes.length * 10);
  return Math.min(100, score);
}

function calculateContentScore(factualClaims: number, citableSentences: number, totalSentences: number): number {
  if (totalSentences === 0) return 20;
  const factualRatio = factualClaims / totalSentences;
  const citableRatio = citableSentences / totalSentences;
  return Math.min(100, Math.round(20 + (factualRatio * 200) + (citableRatio * 200)));
}

function calculateTechnicalScore(html: string): number {
  let score = 50;
  if (html.includes('viewport')) score += 15;
  if (html.includes('lang=')) score += 10;
  if (!html.includes('noindex')) score += 15;
  if (html.includes('canonical')) score += 10;
  return Math.min(100, score);
}

function calculateBrandMentionScore(content: string): number {
  const length = content.length;
  if (length < 500) return 30;
  if (length < 2000) return 50;
  if (length < 5000) return 70;
  return 85;
}

function getBrandMentionability(score: number): string {
  if (score >= 80) return 'High - Strong potential for AI citations';
  if (score >= 60) return 'Medium - Moderate mention potential';
  if (score >= 40) return 'Low - Limited AI visibility';
  return 'Very Low - Needs significant improvement';
}

function getTechnicalIssues(html: string): string[] {
  const issues: string[] = [];
  if (!html.includes('viewport')) issues.push('Missing mobile viewport meta tag');
  if (!html.includes('lang=')) issues.push('Missing language attribute');
  if (html.includes('noindex')) issues.push('Page is marked as noindex');
  if (!html.includes('canonical')) issues.push('Missing canonical URL');
  if (!html.includes('description')) issues.push('Missing meta description');
  return issues;
}

function getTechnicalRecommendations(html: string): string[] {
  const recs: string[] = [];
  if (!html.includes('application/ld+json')) {
    recs.push('Add JSON-LD structured data for better AI understanding');
  }
  recs.push('Ensure fast page load times for crawler efficiency');
  recs.push('Use semantic HTML5 elements (article, section, nav)');
  return recs;
}

function getSchemaRecommendations(hasJsonLd: boolean, types: string[]): string[] {
  const recs: string[] = [];
  if (!hasJsonLd) {
    recs.push('Add JSON-LD structured data markup');
  }
  if (!types.includes('Organization') && !types.includes('LocalBusiness')) {
    recs.push('Add Organization or LocalBusiness schema');
  }
  if (!types.includes('FAQPage')) {
    recs.push('Consider adding FAQPage schema for Q&A content');
  }
  if (!types.includes('Article') && !types.includes('BlogPosting')) {
    recs.push('Add Article schema for blog/news content');
  }
  return recs;
}

function getContentRecommendations(factualClaims: number, citableSentences: number): string[] {
  const recs: string[] = [];
  if (factualClaims < 5) {
    recs.push('Add more factual claims with statistics and data');
  }
  if (citableSentences < 10) {
    recs.push('Create more substantive, citable content paragraphs');
  }
  recs.push('Include expert quotes and authoritative sources');
  recs.push('Add unique research or original data when possible');
  return recs;
}
