import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/AppHeader';
import { ToolCards } from '@/components/ToolCards';
import { SuiteTabNav } from '@/components/SuiteTabNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, Loader2, Plus, X, Search, Target, 
  ArrowRight, BarChart3, Lightbulb, AlertTriangle
} from 'lucide-react';

type KeywordOpportunity = {
  keyword: string;
  competitorUrl: string;
  estimatedVolume: string;
  difficulty: string;
  opportunityScore: number;
  contentGap: string;
  suggestedAction: string;
};

type GapResult = {
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
};

const KeywordGap = () => {
  const { toast } = useToast();
  const [yourUrl, setYourUrl] = useState('');
  const [competitors, setCompetitors] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GapResult | null>(null);
  const [loadingStep, setLoadingStep] = useState('');

  const addCompetitor = () => {
    if (competitors.length < 5) {
      setCompetitors([...competitors, '']);
    }
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const updateCompetitor = (index: number, value: string) => {
    const updated = [...competitors];
    updated[index] = value;
    setCompetitors(updated);
  };

  const handleAnalyze = async () => {
    if (!yourUrl.trim()) {
      toast({ title: 'Your URL is required', variant: 'destructive' });
      return;
    }

    const validCompetitors = competitors.filter(c => c.trim());
    if (validCompetitors.length === 0) {
      toast({ title: 'At least one competitor URL is required', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // Scrape your site
      setLoadingStep('Analyzing your website...');
      const yourScrape = await firecrawlApi.scrape(yourUrl, {
        formats: ['markdown'],
        onlyMainContent: true,
      });

      if (!yourScrape.success) {
        throw new Error('Failed to scrape your website');
      }

      // Scrape competitors
      setLoadingStep('Analyzing competitors...');
      const competitorContent: { url: string; markdown: string }[] = [];
      
      for (const url of validCompetitors) {
        try {
          const scrape = await firecrawlApi.scrape(url, {
            formats: ['markdown'],
            onlyMainContent: true,
          });
          if (scrape.success && scrape.data) {
            competitorContent.push({ url, markdown: scrape.data.markdown || '' });
          }
        } catch (e) {
          console.error(`Failed to scrape ${url}:`, e);
        }
      }

      // Analyze gaps
      setLoadingStep('Identifying keyword opportunities...');
      const { data, error } = await supabase.functions.invoke('keyword-gap-analysis', {
        body: {
          yourUrl,
          competitorUrls: validCompetitors,
          yourContent: yourScrape.data?.markdown || '',
          competitorContent,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setResult(data.result);
      toast({
        title: '✅ Analysis Complete',
        description: `Found ${data.result.totalOpportunities} keyword opportunities`,
      });
    } catch (error) {
      console.error('Keyword gap error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'low': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 'high': return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-lime-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-green-500/5 blur-[100px] rounded-full" />
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-500/10 text-lime-600 dark:text-lime-400 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                Competitive Keyword Intelligence
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                Keyword Gap <span className="gradient-text">Analysis</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                Discover keyword opportunities your competitors rank for that you're missing. 
                Prioritized by traffic potential and difficulty.
              </p>
            </div>

            {/* Input Form */}
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Your Website URL</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="url"
                      value={yourUrl}
                      onChange={(e) => setYourUrl(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="pl-12 h-12"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Competitor URLs</label>
                    {competitors.length < 5 && (
                      <Button variant="ghost" size="sm" onClick={addCompetitor} disabled={isLoading}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {competitors.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="relative flex-1">
                          <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="url"
                            value={url}
                            onChange={(e) => updateCompetitor(index, e.target.value)}
                            placeholder={`https://competitor${index + 1}.com`}
                            className="pl-12"
                            disabled={isLoading}
                          />
                        </div>
                        {competitors.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCompetitor(index)}
                            disabled={isLoading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleAnalyze} disabled={isLoading} className="w-full h-12">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {loadingStep || 'Analyzing...'}
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Find Keyword Gaps
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Results */}
            {result && !isLoading && (
              <div className="max-w-5xl mx-auto space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass-card rounded-xl p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">{result.totalOpportunities}</div>
                    <p className="text-sm text-muted-foreground">Opportunities</p>
                  </div>
                  <div className="glass-card rounded-xl p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-500">{result.uniqueToYou.length}</div>
                    <p className="text-sm text-muted-foreground">Unique to You</p>
                  </div>
                  <div className="glass-card rounded-xl p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-500">{result.sharedKeywords.length}</div>
                    <p className="text-sm text-muted-foreground">Shared Keywords</p>
                  </div>
                  <div className="glass-card rounded-xl p-4 text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-orange-500">{result.contentGaps.length}</div>
                    <p className="text-sm text-muted-foreground">Content Gaps</p>
                  </div>
                </div>

                {/* Top Opportunities */}
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    Top Keyword Opportunities
                  </h3>
                  <div className="overflow-x-auto -mx-6 px-6">
                    <div className="min-w-[600px]">
                      <div className="space-y-3">
                        {result.topOpportunities.map((opp, i) => (
                          <div key={i} className="p-4 bg-muted rounded-lg">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                              <span className="font-medium">{opp.keyword}</span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={getDifficultyColor(opp.difficulty)}>
                                  {opp.difficulty}
                                </Badge>
                                <Badge variant="outline">{opp.estimatedVolume}</Badge>
                                <Badge variant="secondary">Score: {opp.opportunityScore}</Badge>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <ArrowRight className="w-4 h-4 flex-shrink-0" />
                              {opp.suggestedAction}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Gaps */}
                {result.contentGaps.length > 0 && (
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-primary" />
                      Content Gaps
                    </h3>
                    <div className="space-y-4">
                      {result.contentGaps.map((gap, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="font-medium">{gap.topic}</span>
                            <Badge className={getPriorityColor(gap.priority)}>
                              {gap.priority} Priority
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Your Coverage</p>
                              <Progress value={gap.yourCoverage} className="h-2" />
                              <p className="text-xs mt-1">{gap.yourCoverage}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Competitor Coverage</p>
                              <Progress value={gap.competitorCoverage} className="h-2" />
                              <p className="text-xs mt-1">{gap.competitorCoverage}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keyword Lists */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-500" />
                      Your Top Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.yourKeywords.slice(0, 20).map((kw) => (
                        <Badge key={kw} variant="outline" className="bg-green-500/5">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card rounded-xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      Competitor Keywords (Missing)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.missingKeywords.slice(0, 20).map((opp) => (
                        <Badge key={opp.keyword} variant="outline" className="bg-blue-500/5">
                          {opp.keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
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

export default KeywordGap;
