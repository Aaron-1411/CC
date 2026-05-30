import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { SuiteTabNav } from '@/components/SuiteTabNav';
import { UrlInput } from '@/components/UrlInput';
import { ToolCards } from '@/components/ToolCards';
import { CaseStudyResults } from '@/components/CaseStudyResults';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { caseStudyApi, CaseStudy as CaseStudyType } from '@/lib/api/caseStudy';
import { 
  BookOpen, Sparkles, Target, TrendingUp, Megaphone, 
  Users, Trophy, Building2, ChevronDown, Download, Copy, RefreshCw
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const CaseStudy = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [caseStudy, setCaseStudy] = useState<CaseStudyType | null>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [showContextInput, setShowContextInput] = useState(false);

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setLoadingStep('Scraping website content...');
    setCaseStudy(null);
    setAnalyzedUrl(url);

    try {
      // Step 1: Scrape the website
      const scrapeResult = await firecrawlApi.scrape(url, {
        formats: ['markdown', 'links'],
        onlyMainContent: false,
      });

      if (!scrapeResult.success) {
        throw new Error(scrapeResult.error || 'Failed to scrape website');
      }

      setLoadingStep('Analyzing brand strategy...');

      // Step 2: Generate the case study
      const caseStudyResult = await caseStudyApi.generate(
        url, 
        scrapeResult.data || {},
        additionalContext
      );

      if (!caseStudyResult.success || !caseStudyResult.caseStudy) {
        throw new Error(caseStudyResult.error || 'Failed to generate case study');
      }

      setCaseStudy(caseStudyResult.caseStudy);
      toast({
        title: 'Case study complete',
        description: `Analysis of ${caseStudyResult.caseStudy.brandName} is ready`,
      });
    } catch (error) {
      console.error('Case study error:', error);
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Failed to generate case study',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleCopyToClipboard = () => {
    if (!caseStudy) return;
    
    const text = JSON.stringify(caseStudy, null, 2);
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Case study data copied as JSON',
    });
  };

  const handleReset = () => {
    setCaseStudy(null);
    setAnalyzedUrl('');
    setAdditionalContext('');
  };

  const features = [
    { icon: Target, title: 'Strategic Framing', desc: 'Understand what game the brand is really playing' },
    { icon: TrendingUp, title: 'Scale Analysis', desc: 'Traffic, revenue proxies, and growth signals' },
    { icon: Megaphone, title: 'Media Strategy', desc: 'Paid ads, organic social, and creative angles' },
    { icon: Users, title: 'Influencer Engine', desc: 'Affiliate programs and creator partnerships' },
    { icon: Trophy, title: 'Competitive Moats', desc: 'What makes them hard to copy' },
    { icon: Building2, title: 'Competitor Intel', desc: 'Automatic competitor identification and analysis' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <SuiteTabNav suite="seo" className="mb-8" />
        
        {!caseStudy ? (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <BookOpen className="w-4 h-4" />
                Deep Research Tool
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Case Study Deep Dive
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get investment-grade brand analysis with competitor research, growth levers, and actionable emulation plans.
              </p>
            </div>

            {/* URL Input */}
            <div className="space-y-4">
              <UrlInput 
                onAnalyze={handleAnalyze} 
                isLoading={isLoading}
                placeholder="Enter brand website URL..."
                buttonText="Research"
              />
              
              {/* Optional Context */}
              <div className="max-w-2xl mx-auto">
                <Collapsible open={showContextInput} onOpenChange={setShowContextInput}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Add context or specific questions
                      <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showContextInput ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="context">Additional Context (Optional)</Label>
                      <Textarea
                        id="context"
                        value={additionalContext}
                        onChange={(e) => setAdditionalContext(e.target.value)}
                        placeholder="e.g., Focus on their TikTok strategy, I'm in the skincare industry, Compare to Glossier..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="w-full max-w-xl mx-auto py-16">
                <div className="relative flex flex-col items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-primary/20 blur-3xl animate-pulse" />
                  </div>
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-muted/30" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
                  </div>
                  <p className="text-lg font-medium mb-2">{loadingStep}</p>
                  <p className="text-sm text-muted-foreground">This may take 1-2 minutes for comprehensive research</p>
                </div>
              </div>
            )}

            {/* Features Grid */}
            {!isLoading && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature, i) => (
                  <div key={i} className="glass-card rounded-xl p-5 space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* What You'll Get */}
            {!isLoading && (
              <div className="glass-card rounded-xl p-6 md:p-8">
                <h2 className="text-xl font-bold mb-4">What's Included in Your Case Study</h2>
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">1</span>
                      </div>
                      <div>
                        <p className="font-medium">Strategic Inputs & Framing</p>
                        <p className="text-muted-foreground">Category story, business model, and growth stage analysis</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">2</span>
                      </div>
                      <div>
                        <p className="font-medium">Scale & Revenue Snapshot</p>
                        <p className="text-muted-foreground">Traffic estimates, channel mix, team signals, and revenue proxies</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">3</span>
                      </div>
                      <div>
                        <p className="font-medium">Offer & Funnel Mechanics</p>
                        <p className="text-muted-foreground">Product architecture, pricing, objection handling, and trust signals</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">4</span>
                      </div>
                      <div>
                        <p className="font-medium">Paid Media Engine</p>
                        <p className="text-muted-foreground">Channel roles, funnel mapping, creative angles, and format analysis</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">5</span>
                      </div>
                      <div>
                        <p className="font-medium">Organic Social Strategy</p>
                        <p className="text-muted-foreground">Platform roles, content pillars, hook patterns, and founder visibility</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">6</span>
                      </div>
                      <div>
                        <p className="font-medium">Influencer & Affiliate Engine</p>
                        <p className="text-muted-foreground">Creator strategy, partnerships, and distribution risk profile</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">7</span>
                      </div>
                      <div>
                        <p className="font-medium">Why They Win + Moats</p>
                        <p className="text-muted-foreground">Growth levers, hard-to-copy advantages, and competitive weaknesses</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">8</span>
                      </div>
                      <div>
                        <p className="font-medium">30-Day Emulation Plan</p>
                        <p className="text-muted-foreground">Actionable weekly plan to replicate their strategy</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Case study for</p>
                <p className="font-medium">{analyzedUrl}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy JSON
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Study
                </Button>
              </div>
            </div>

            {/* Results */}
            <CaseStudyResults caseStudy={caseStudy} />
          </div>
        )}

        {/* Other Tools */}
        {!isLoading && <ToolCards exclude="case-study" />}
      </main>
    </div>
  );
};

export default CaseStudy;
