import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAnalysisStore } from '@/hooks/useAnalysisStore';
import { UrlInput } from '@/components/UrlInput';
import { LoadingState } from '@/components/LoadingState';
import { AnalysisResults } from '@/components/AnalysisResults';
import { CrawlModeToggle } from '@/components/CrawlModeToggle';
import { CompetitorInput } from '@/components/CompetitorInput';
import { AppHeader } from '@/components/AppHeader';
import { ToolCards } from '@/components/ToolCards';
import { SuiteTabNav } from '@/components/SuiteTabNav';
import { firecrawlApi, ScrapeData } from '@/lib/api/firecrawl';
import { analyzeApi, AnalysisResult } from '@/lib/api/analyze';
import { analysesApi } from '@/lib/api/analyses';
import { ToastAction } from '@/components/ui/toast';
import { Loader2, Save, Check, BarChart3, Search, TrendingUp, FileDown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportAnalysisToPdf } from '@/lib/exportPdf';

type Step = 'idle' | 'mapping' | 'scraping' | 'analyzing' | 'generating' | 'done';

type CrawlProgress = {
  current: number;
  total: number;
  currentUrl?: string;
};

const MAX_CRAWL_PAGES = 5;

const Analyze = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentAnalysis, setCurrentAnalysis, hasUnsavedAnalysis } = useAnalysisStore();
  
  const [step, setStep] = useState<Step>('idle');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [scrapeData, setScrapeData] = useState<ScrapeData | null>(null);
  const [metadata, setMetadata] = useState<{ title?: string; description?: string; sourceURL?: string } | null>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState('');
  const [crawlMode, setCrawlMode] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState<CrawlProgress>({ current: 0, total: 0 });
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Restore analysis from store if navigating back
  useEffect(() => {
    if (currentAnalysis && currentAnalysis.analysis && step === 'idle') {
      setAnalysis(currentAnalysis.analysis);
      setScrapeData(currentAnalysis.scrapeData);
      setMetadata(currentAnalysis.metadata);
      setAnalyzedUrl(currentAnalysis.analyzedUrl);
      setCrawlProgress({ current: 0, total: currentAnalysis.pagesAnalyzed });
      setStep('done');
    }
  }, []);

  // Save analysis to store when completed
  useEffect(() => {
    if (step === 'done' && analysis) {
      setCurrentAnalysis({
        analysis,
        scrapeData,
        metadata,
        analyzedUrl,
        pagesAnalyzed: crawlProgress.total || 1,
      });
    }
  }, [step, analysis]);

  const handleAnalyze = async (url: string) => {
    setStep(crawlMode ? 'mapping' : 'scraping');
    setAnalysis(null);
    setScrapeData(null);
    setAnalyzedUrl(url);
    setCrawlProgress({ current: 0, total: 0 });
    setSaved(false);

    try {
      let combinedMarkdown = '';
      let combinedHtml = '';
      let allLinks: string[] = [];
      let mainScreenshot: string | undefined;
      let mainMetadata: { title?: string; description?: string; sourceURL?: string } = {};

      if (crawlMode) {
        const mapResult = await firecrawlApi.map(url, { limit: MAX_CRAWL_PAGES });
        
        if (!mapResult.success || !mapResult.links?.length) {
          throw new Error(mapResult.error || 'Failed to map website pages');
        }

        const pagesToScrape = mapResult.links.slice(0, MAX_CRAWL_PAGES);
        setCrawlProgress({ current: 0, total: pagesToScrape.length });
        setStep('scraping');

        for (let i = 0; i < pagesToScrape.length; i++) {
          const pageUrl = pagesToScrape[i];
          setCrawlProgress({ current: i + 1, total: pagesToScrape.length, currentUrl: pageUrl });

          const scrapeResult = await firecrawlApi.scrape(pageUrl, {
            formats: i === 0 ? ['markdown', 'html', 'links', 'screenshot'] : ['markdown', 'html', 'links'],
            onlyMainContent: true,
          });

          if (scrapeResult.success && scrapeResult.data) {
            const data = scrapeResult.data;
            combinedMarkdown += `\n\n--- PAGE: ${pageUrl} ---\n\n${data.markdown || ''}`;
            combinedHtml += data.html || '';
            allLinks = [...allLinks, ...(data.links || [])];
            
            if (i === 0) {
              mainScreenshot = data.screenshot;
              mainMetadata = data.metadata || {};
            }
          }
        }
      } else {
        const scrapeResult = await firecrawlApi.scrape(url, {
          formats: ['markdown', 'html', 'links', 'screenshot'],
          onlyMainContent: false,
        });

        if (!scrapeResult.success) {
          throw new Error(scrapeResult.error || 'Failed to scrape website');
        }

        const data = scrapeResult.data || {};
        combinedMarkdown = data.markdown || '';
        combinedHtml = data.html || '';
        allLinks = data.links || [];
        mainScreenshot = data.screenshot;
        mainMetadata = data.metadata || {};
      }

      setScrapeData({
        markdown: combinedMarkdown,
        html: combinedHtml,
        links: allLinks,
        screenshot: mainScreenshot,
        metadata: mainMetadata,
      });
      setStep('analyzing');

      const analyzeResult = await analyzeApi.analyze(
        { data: { markdown: combinedMarkdown, html: combinedHtml, links: allLinks, metadata: mainMetadata } },
        url,
        competitors.length > 0 ? competitors : undefined
      );

      if (!analyzeResult.success) {
        throw new Error(analyzeResult.error || 'Failed to analyze website');
      }

      setStep('generating');
      await new Promise((resolve) => setTimeout(resolve, 800));

      setAnalysis(analyzeResult.analysis!);
      setMetadata(analyzeResult.metadata);
      setStep('done');

      // Show toast with action to view report
      toast({
        title: '✅ Analysis Complete',
        description: crawlMode 
          ? `Analyzed ${crawlProgress.total} pages with ${analyzeResult.analysis?.topRecommendations?.length || 0} recommendations`
          : `Overall score: ${analyzeResult.analysis?.overallScore || 0}/100`,
        action: (
          <ToastAction 
            altText="View Report" 
            onClick={() => {
              // Scroll to top to see the report
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            View Report
          </ToastAction>
        ),
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
      setStep('idle');
    }
  };

  const handleSave = async () => {
    if (!analysis || !user) return;
    
    setSaving(true);
    const result = await analysesApi.save({
      url: analyzedUrl,
      analyzedUrl: analyzedUrl,
      screenshotUrl: scrapeData?.screenshot,
      analysisData: analysis,
      metadata: metadata || undefined,
      pagesAnalyzed: crawlMode ? crawlProgress.total : 1,
    });

    if (result.success && result.data) {
      setSaved(true);
      setCurrentAnalysis(null); // Clear store since it's now saved
      toast({ 
        title: '✅ Saved to Dashboard', 
        description: 'View your saved analyses anytime.',
        action: (
          <ToastAction 
            altText="View Dashboard" 
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </ToastAction>
        ),
      });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleReset = () => {
    setStep('idle');
    setAnalysis(null);
    setScrapeData(null);
    setMetadata(null);
    setAnalyzedUrl('');
    setCrawlProgress({ current: 0, total: 0 });
    setCompetitors([]);
    setSaved(false);
    setCurrentAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/3 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10">
        <AppHeader />

        <main className="container pb-20">
          {/* Suite Tab Navigation */}
          <div className="pt-6 pb-4">
            <SuiteTabNav suite="seo" />
          </div>
          {/* Persistent notification bar when analysis exists */}
          {step === 'done' && analysis && (
            <div className="sticky top-[73px] z-40 -mx-4 px-4 py-2 bg-primary/10 backdrop-blur-xl border-b border-primary/20">
              <div className="container flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {metadata?.title || analyzedUrl}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Score: <span className={analysis.overallScore >= 70 ? 'text-green-400' : 'text-orange-400'}>{analysis.overallScore}/100</span>
                      {' · '}{analysis.topRecommendations?.length || 0} recommendations
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exportAnalysisToPdf({
                      analysis,
                      metadata: metadata || undefined,
                      url: analyzedUrl,
                      screenshot: scrapeData?.screenshot,
                    })}
                    title="Export as PDF"
                  >
                    <FileDown className="w-4 h-4 mr-1" />
                    PDF
                  </Button>
                  {user ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSave}
                      disabled={saving || saved}
                    >
                      {saved ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Saved
                        </>
                      ) : saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/auth">Sign in to Save</Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    New Analysis
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 'idle' && (
            <div className="py-12 md:py-16 space-y-12 max-w-4xl mx-auto">
              {/* Hero */}
              <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  AI-Powered Deep Analysis
                </div>
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  Website <span className="gradient-text">Analyzer</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Get comprehensive AI analysis of any website with 30+ metrics including UX effectiveness, conversion optimization, industry positioning, and technical SEO health.
                </p>
              </div>

              {/* Input */}
              <div className="max-w-3xl mx-auto space-y-4">
                <UrlInput onAnalyze={handleAnalyze} isLoading={false} />
                <CrawlModeToggle enabled={crawlMode} onToggle={setCrawlMode} />
                {crawlMode && (
                  <p className="text-center text-sm text-muted-foreground">
                    Multi-page deep crawl: analyzes up to {MAX_CRAWL_PAGES} pages for comprehensive insights
                  </p>
                )}
                <CompetitorInput 
                  competitors={competitors} 
                  onChange={setCompetitors} 
                  maxCompetitors={3}
                />
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card rounded-xl p-5 text-center">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">30+ Metrics</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive scoring across UX, visual design, conversion, and SEO dimensions.
                  </p>
                </div>
                <div className="glass-card rounded-xl p-5 text-center">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Industry Detection</h3>
                  <p className="text-sm text-muted-foreground">
                    AI identifies business type, target audience, and competitive positioning.
                  </p>
                </div>
                <div className="glass-card rounded-xl p-5 text-center">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Actionable Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Specific recommendations prioritized by impact for immediate implementation.
                  </p>
                </div>
              </div>

              {/* Tool Cards */}
              <ToolCards exclude={['analyze', 'keyword-gap', 'ai-visibility']} />
            </div>
          )}

          {(step === 'mapping' || step === 'scraping' || step === 'analyzing' || step === 'generating') && (
            <LoadingState 
              step={step as 'mapping' | 'scraping' | 'analyzing' | 'generating'} 
              progress={crawlProgress}
              isCrawlMode={crawlMode}
            />
          )}

          {step === 'done' && analysis && (
            <div className="py-8">
              <AnalysisResults 
                analysis={analysis} 
                metadata={metadata || undefined} 
                url={analyzedUrl}
                screenshot={scrapeData?.screenshot}
              />
              
              {/* Tool Cards at bottom */}
              <ToolCards exclude={['analyze', 'keyword-gap', 'ai-visibility']} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Analyze;
