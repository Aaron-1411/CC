import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/AppHeader';
import { ToolCards } from '@/components/ToolCards';
import { SuiteTabNav } from '@/components/SuiteTabNav';
import { UrlInput } from '@/components/UrlInput';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { supabase } from '@/integrations/supabase/client';
import { 
  Eye, Loader2, Bot, FileCode, Sparkles, AlertCircle, 
  CheckCircle2, XCircle, TrendingUp, Globe, Search
} from 'lucide-react';

type VisibilityResult = {
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
};

const AIVisibility = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VisibilityResult | null>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState('');

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setResult(null);
    setAnalyzedUrl(url);

    try {
      // First scrape the website
      const scrapeResult = await firecrawlApi.scrape(url, {
        formats: ['markdown', 'html'],
        onlyMainContent: false,
      });

      if (!scrapeResult.success) {
        throw new Error(scrapeResult.error || 'Failed to fetch website');
      }

      // Then analyze for AI visibility
      const { data, error } = await supabase.functions.invoke('ai-visibility-check', {
        body: {
          url,
          scrapedContent: scrapeResult.data,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setResult(data.result);
      toast({
        title: '✅ Analysis Complete',
        description: `AI Visibility Score: ${data.result.overallScore}/100`,
      });
    } catch (error) {
      console.error('AI visibility check error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-yellow-500/10';
    if (score >= 40) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-teal-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10">
        <AppHeader />

        <main className="container pb-20">
          {/* Suite Tab Navigation */}
          <div className="pt-6 pb-4">
            <SuiteTabNav suite="seo" />
          </div>

          <div className="py-8 md:py-12 space-y-12">
            {/* Hero */}
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                <Bot className="w-4 h-4" />
                AI Crawler Optimization
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                AI Search <span className="gradient-text">Visibility</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                Check if your site is optimized for AI crawlers like ChatGPT, Perplexity, and Gemini. 
                Track brand mentions and citation potential in LLM responses.
              </p>
            </div>

            {/* Input */}
            <div className="max-w-2xl mx-auto">
              <UrlInput onAnalyze={handleAnalyze} isLoading={isLoading} />
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <Bot className="w-8 h-8 text-emerald-500 animate-pulse" />
                  </div>
                </div>
                <p className="text-muted-foreground">Analyzing AI visibility factors...</p>
              </div>
            )}

            {/* Results */}
            {result && !isLoading && (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Overall Score */}
                <div className="glass-card rounded-2xl p-6 sm:p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-2">AI Visibility Score</p>
                  <div className={`text-5xl sm:text-6xl font-bold ${getScoreColor(result.overallScore)}`}>
                    {result.overallScore}
                  </div>
                  <p className="text-muted-foreground mt-2">/100</p>
                  <p className="text-sm mt-4">{analyzedUrl}</p>
                </div>

                {/* Score Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`glass-card rounded-xl p-4 ${getScoreBg(result.aiCrawlerReadiness.score)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="w-5 h-5 text-primary" />
                      <span className="font-medium text-sm">Crawler Ready</span>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(result.aiCrawlerReadiness.score)}`}>
                      {result.aiCrawlerReadiness.score}%
                    </div>
                  </div>
                  <div className={`glass-card rounded-xl p-4 ${getScoreBg(result.llmMentionPotential.score)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="font-medium text-sm">LLM Potential</span>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(result.llmMentionPotential.score)}`}>
                      {result.llmMentionPotential.score}%
                    </div>
                  </div>
                  <div className={`glass-card rounded-xl p-4 ${getScoreBg(result.structuredData.score)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <FileCode className="w-5 h-5 text-primary" />
                      <span className="font-medium text-sm">Schema Data</span>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(result.structuredData.score)}`}>
                      {result.structuredData.score}%
                    </div>
                  </div>
                  <div className={`glass-card rounded-xl p-4 ${getScoreBg(result.contentOptimization.score)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span className="font-medium text-sm">Content Quality</span>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(result.contentOptimization.score)}`}>
                      {result.contentOptimization.score}%
                    </div>
                  </div>
                </div>

                {/* Technical Readiness */}
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Technical Readiness
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                      { label: 'AI Crawlers', value: result.technicalReadiness.allowsAICrawlers },
                      { label: 'Mobile Optimized', value: result.technicalReadiness.mobileOptimized },
                      { label: 'Sitemap', value: result.technicalReadiness.hasSitemap },
                      { label: 'Robots.txt', value: result.technicalReadiness.hasRobotsTxt },
                      { label: 'Load Speed', value: result.technicalReadiness.loadSpeed === 'Good' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        {item.value ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        )}
                        <span className="text-sm">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* LLM Mention Potential */}
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    LLM Citation Potential
                  </h3>
                  <p className="text-muted-foreground mb-4">{result.llmMentionPotential.brandMentionability}</p>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground">Content Citability:</span>
                    <Progress value={result.llmMentionPotential.contentCitability} className="flex-1 max-w-xs" />
                    <span className="text-sm font-medium">{result.llmMentionPotential.contentCitability}%</span>
                  </div>
                  {result.llmMentionPotential.topicalAuthority.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Topical Authority:</p>
                      <div className="flex flex-wrap gap-2">
                        {result.llmMentionPotential.topicalAuthority.map((topic) => (
                          <Badge key={topic} variant="secondary">{topic}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Stats */}
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-primary" />
                    Content Analysis
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{result.contentOptimization.factualClaims}</div>
                      <p className="text-sm text-muted-foreground">Factual Claims</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{result.contentOptimization.citableSentences}</div>
                      <p className="text-sm text-muted-foreground">Citable Sentences</p>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    Recommendations
                  </h3>
                  <div className="space-y-3">
                    {[
                      ...result.aiCrawlerReadiness.recommendations,
                      ...result.structuredData.recommendations,
                      ...result.contentOptimization.recommendations,
                    ].slice(0, 6).map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <span className="text-primary font-medium">{i + 1}.</span>
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!result && !isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto px-4">
                <div className="glass-card p-6 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="font-semibold">AI Crawler Check</h3>
                  <p className="text-sm text-muted-foreground">
                    Verify your site is accessible to ChatGPT, Claude, Gemini, and Perplexity
                  </p>
                </div>
                <div className="glass-card p-6 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="font-semibold">Citation Potential</h3>
                  <p className="text-sm text-muted-foreground">
                    Measure how likely your content is to be cited in AI responses
                  </p>
                </div>
                <div className="glass-card p-6 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <FileCode className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="font-semibold">Schema Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Check structured data markup for better AI understanding
                  </p>
                </div>
              </div>
            )}

            <ToolCards exclude={['analyze', 'keyword-gap', 'ai-visibility']} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIVisibility;
