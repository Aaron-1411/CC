const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KeywordOpportunity {
  keyword: string;
  competitorUrl: string;
  estimatedVolume: string;
  difficulty: string;
  opportunityScore: number;
  contentGap: string;
  suggestedAction: string;
}

interface GapAnalysisResult {
  yourKeywords: string[];
  competitorKeywords: string[];
  missingKeywords: KeywordOpportunity[];
  sharedKeywords: string[];
  uniqueToYou: string[];
  totalOpportunities: number;
  topOpportunities: KeywordOpportunity[];
  contentGaps: {
    topic: string;
    competitorCoverage: number;
    yourCoverage: number;
    priority: string;
  }[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { yourUrl, competitorUrls, yourContent, competitorContent } = await req.json();

    if (!yourUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Your URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing keyword gaps for: ${yourUrl} vs ${competitorUrls?.length || 0} competitors`);

    // Extract keywords from your content
    const yourKeywords = extractKeywords(yourContent || '');
    
    // Extract keywords from competitor content
    const allCompetitorKeywords: string[] = [];
    const competitorKeywordSources: Map<string, string> = new Map();
    
    if (competitorContent && Array.isArray(competitorContent)) {
      competitorContent.forEach((content: { url: string; markdown: string }, index: number) => {
        const keywords = extractKeywords(content.markdown || '');
        keywords.forEach(kw => {
          if (!allCompetitorKeywords.includes(kw)) {
            allCompetitorKeywords.push(kw);
            competitorKeywordSources.set(kw, content.url || competitorUrls?.[index] || 'Competitor');
          }
        });
      });
    }

    // Find gaps
    const yourKeywordSet = new Set(yourKeywords.map(k => k.toLowerCase()));
    const missingKeywords: KeywordOpportunity[] = [];
    const sharedKeywords: string[] = [];
    
    allCompetitorKeywords.forEach(kw => {
      const kwLower = kw.toLowerCase();
      if (yourKeywordSet.has(kwLower)) {
        if (!sharedKeywords.includes(kw)) {
          sharedKeywords.push(kw);
        }
      } else {
        const opportunity = createKeywordOpportunity(kw, competitorKeywordSources.get(kw) || '');
        missingKeywords.push(opportunity);
      }
    });

    // Find keywords unique to you
    const competitorKeywordSet = new Set(allCompetitorKeywords.map(k => k.toLowerCase()));
    const uniqueToYou = yourKeywords.filter(kw => !competitorKeywordSet.has(kw.toLowerCase()));

    // Sort by opportunity score
    missingKeywords.sort((a, b) => b.opportunityScore - a.opportunityScore);

    // Create content gaps analysis
    const contentGaps = analyzeContentGaps(yourKeywords, allCompetitorKeywords);

    const result: GapAnalysisResult = {
      yourKeywords: yourKeywords.slice(0, 50),
      competitorKeywords: allCompetitorKeywords.slice(0, 50),
      missingKeywords: missingKeywords.slice(0, 30),
      sharedKeywords: sharedKeywords.slice(0, 20),
      uniqueToYou: uniqueToYou.slice(0, 20),
      totalOpportunities: missingKeywords.length,
      topOpportunities: missingKeywords.slice(0, 10),
      contentGaps,
    };

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Keyword gap analysis error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractKeywords(content: string): string[] {
  // Clean and tokenize
  const words = content
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  // Count word frequency
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    if (!isStopWord(word)) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  });
  
  // Extract bigrams (two-word phrases)
  const bigrams = new Map<string, number>();
  for (let i = 0; i < words.length - 1; i++) {
    if (!isStopWord(words[i]) && !isStopWord(words[i + 1])) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }
  }
  
  // Combine and sort by frequency
  const allKeywords: [string, number][] = [
    ...Array.from(wordFreq.entries()).filter(([_, count]) => count > 1),
    ...Array.from(bigrams.entries()).filter(([_, count]) => count > 1),
  ];
  
  allKeywords.sort((a, b) => b[1] - a[1]);
  
  return allKeywords.slice(0, 100).map(([kw]) => kw);
}

function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her',
    'was', 'one', 'our', 'out', 'has', 'have', 'been', 'would', 'could', 'their',
    'what', 'when', 'who', 'will', 'with', 'this', 'that', 'from', 'they', 'were',
    'been', 'have', 'many', 'some', 'them', 'these', 'than', 'first', 'into', 'just',
    'also', 'more', 'your', 'about', 'other', 'which', 'then', 'such', 'here', 'there',
  ]);
  return stopWords.has(word);
}

function createKeywordOpportunity(keyword: string, competitorUrl: string): KeywordOpportunity {
  // Estimate metrics based on keyword characteristics
  const wordCount = keyword.split(' ').length;
  const length = keyword.length;
  
  // Longer keywords = lower difficulty, higher opportunity for long-tail
  const difficulty = wordCount > 2 ? 'Low' : wordCount > 1 ? 'Medium' : 'High';
  const estimatedVolume = wordCount > 2 ? '100-500' : wordCount > 1 ? '500-2K' : '2K-10K';
  
  // Calculate opportunity score
  let score = 50;
  if (difficulty === 'Low') score += 20;
  if (difficulty === 'Medium') score += 10;
  if (wordCount > 1) score += 15; // Prefer phrases
  score = Math.min(100, score + Math.floor(Math.random() * 20));
  
  const actions = [
    'Create dedicated landing page',
    'Add section to existing content',
    'Create blog post targeting this term',
    'Optimize existing page for this keyword',
    'Create comparison content',
  ];
  
  return {
    keyword,
    competitorUrl,
    estimatedVolume,
    difficulty,
    opportunityScore: score,
    contentGap: `Missing content for "${keyword}"`,
    suggestedAction: actions[Math.floor(Math.random() * actions.length)],
  };
}

function analyzeContentGaps(yourKeywords: string[], competitorKeywords: string[]): { 
  topic: string; 
  competitorCoverage: number; 
  yourCoverage: number; 
  priority: string; 
}[] {
  // Group keywords into topics
  const topics = ['pricing', 'features', 'comparison', 'tutorial', 'review', 'guide', 'how-to', 'best'];
  
  return topics.map(topic => {
    const yourCount = yourKeywords.filter(k => k.includes(topic)).length;
    const compCount = competitorKeywords.filter(k => k.includes(topic)).length;
    
    const yourCoverage = Math.min(100, yourCount * 20);
    const competitorCoverage = Math.min(100, compCount * 20);
    
    let priority = 'Low';
    if (competitorCoverage > yourCoverage + 30) priority = 'High';
    else if (competitorCoverage > yourCoverage + 10) priority = 'Medium';
    
    return {
      topic: topic.charAt(0).toUpperCase() + topic.slice(1) + ' Content',
      competitorCoverage,
      yourCoverage,
      priority,
    };
  }).filter(gap => gap.competitorCoverage > gap.yourCoverage);
}
