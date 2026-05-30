import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppHeader } from '@/components/AppHeader';
import { ToolCards } from '@/components/ToolCards';
import { SuiteTabNav } from '@/components/SuiteTabNav';
import { GeneratedAdCard } from '@/components/GeneratedAdCard';
import { BrandInsightSelector } from '@/components/BrandInsightSelector';
import { useSavedAds } from '@/components/SavedAdsLibrary';
import { adGeneratorApi, BrandAnalysis, GeneratedAd, SavedAdForInspo, SelectedInsights } from '@/lib/api/adGenerator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { 
  Search, 
  Loader2, 
  Wand2,
  AlertCircle,
  Sparkles,
  Target,
  Palette,
  FileText,
  ChevronRight,
  Folder,
  Check,
  ArrowLeft,
  Download,
  FileJson
} from 'lucide-react';

type Step = 'input' | 'select' | 'results';

const AdGenerator = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [brandAnalysis, setBrandAnalysis] = useState<BrandAnalysis | null>(null);
  const [generatedAds, setGeneratedAds] = useState<GeneratedAd[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'meta', 'google']);
  const [useInspoAds, setUseInspoAds] = useState(true);
  const [metadata, setMetadata] = useState<{ title: string; description: string; url: string } | null>(null);
  
  const { savedAds } = useSavedAds();

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platform)) {
        return prev.filter(p => p !== platform);
      }
      return [...prev, platform];
    });
  };

  // Step 1: Analyze the website
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      toast({
        title: 'URL Required',
        description: 'Please enter a website URL to analyze',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const result = await adGeneratorApi.analyze({ url: trimmedUrl });

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      setBrandAnalysis(result.brandAnalysis || null);
      setMetadata(result.metadata || null);
      setStep('select');

      toast({
        title: 'Brand Analyzed!',
        description: 'Select the insights you want to use for your ads',
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2: Generate ads based on selections
  const handleGenerate = async (selected: SelectedInsights) => {
    if (!brandAnalysis) return;

    if (selectedPlatforms.length === 0) {
      toast({
        title: 'Platform Required',
        description: 'Please select at least one ad platform',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Prepare inspo ads if enabled
      const inspoAds: SavedAdForInspo[] = useInspoAds && savedAds.length > 0
        ? savedAds.slice(0, 5).map(ad => ({
            platform: ad.platform,
            advertiser: ad.advertiser,
            adTitle: ad.adTitle,
            adCopy: ad.adCopy,
          }))
        : [];

      const result = await adGeneratorApi.generate({
        brandAnalysis,
        selectedInsights: selected,
        platforms: selectedPlatforms,
        savedAdsForInspo: inspoAds,
      });

      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }

      setGeneratedAds(result.generatedAds || []);
      setStep('results');

      toast({
        title: 'Ads Generated!',
        description: `Created ${result.generatedAds?.length || 0} personalized ads`,
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    if (step === 'select') {
      setStep('input');
    } else if (step === 'results') {
      setStep('select');
    }
  };

  const handleStartOver = () => {
    setStep('input');
    setBrandAnalysis(null);
    setGeneratedAds([]);
    setMetadata(null);
    setUrl('');
  };

  const exportAds = (format: 'csv' | 'json') => {
    if (generatedAds.length === 0) return;

    if (format === 'json') {
      const json = JSON.stringify(generatedAds, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-ads-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['Platform', 'Format', 'Headline', 'Primary Text', 'CTA', 'Hook', 'Target Persona', 'Marketing Angle'];
      const rows = generatedAds.map(ad => [
        ad.platform,
        ad.format,
        `"${ad.headline.replace(/"/g, '""')}"`,
        `"${ad.primaryText.replace(/"/g, '""')}"`,
        ad.callToAction,
        `"${ad.hook.replace(/"/g, '""')}"`,
        ad.targetPersona,
        ad.marketingAngle,
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-ads-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast({ title: 'Exported!', description: `Ads exported to ${format.toUpperCase()}` });
  };

  const stepIndicators = [
    { label: 'Analyze', active: step === 'input', done: step !== 'input' },
    { label: 'Select', active: step === 'select', done: step === 'results' },
    { label: 'Generate', active: step === 'results', done: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-orange-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10">
        <AppHeader />

        <main className="container pb-20">
          {/* Suite Tab Navigation */}
          <div className="pt-6 pb-4">
            <SuiteTabNav suite="ads" />
          </div>

          <div className="py-8 md:py-12 space-y-8">
            {/* Hero */}
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-400 text-sm font-medium">
                AI-Powered Ad Creation
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Ad <span className="gradient-text">Generator</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {step === 'input' && 'Analyze any website to extract brand insights, then customize which elements to use in your ads.'}
                {step === 'select' && 'Select the features, USPs, personas, and angles you want to highlight in your ads.'}
                {step === 'results' && 'Your personalized ads are ready! Copy, export, or regenerate with different selections.'}
              </p>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-4 max-w-lg mx-auto">
              {stepIndicators.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`flex flex-col items-center gap-2 ${s.active ? 'text-primary' : s.done ? 'text-green-400' : 'text-muted-foreground'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      s.active ? 'bg-primary/20 ring-2 ring-primary' : s.done ? 'bg-green-500/10' : 'bg-muted'
                    }`}>
                      {s.done ? <Check className="w-5 h-5" /> : <span className="font-semibold">{i + 1}</span>}
                    </div>
                    <span className="text-xs font-medium">{s.label}</span>
                  </div>
                  {i < stepIndicators.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground mt-[-20px]" />
                  )}
                </div>
              ))}
            </div>

            {/* Back Button */}
            {step !== 'input' && (
              <div className="max-w-4xl mx-auto">
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            )}

            {/* Step 1: Input URL */}
            {step === 'input' && (
              <div className="space-y-8">
                <form onSubmit={handleAnalyze} className="w-full max-w-3xl mx-auto space-y-4">
                  <div className="glass-card p-4 rounded-2xl">
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="text"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder="Enter website URL (e.g., shopify.com)"
                          className="pl-12 h-12 bg-muted/50 border-0 text-base"
                          disabled={isAnalyzing}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={isAnalyzing}
                        className="h-12 px-8"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Analyze Brand
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="glass-card p-4 rounded-xl space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-3">Target Platforms</p>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox 
                            checked={selectedPlatforms.includes('tiktok')} 
                            onCheckedChange={() => togglePlatform('tiktok')}
                          />
                          <span className="text-sm">🎵 TikTok</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox 
                            checked={selectedPlatforms.includes('meta')} 
                            onCheckedChange={() => togglePlatform('meta')}
                          />
                          <span className="text-sm">📘 Meta (FB/IG)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox 
                            checked={selectedPlatforms.includes('google')} 
                            onCheckedChange={() => togglePlatform('google')}
                          />
                          <span className="text-sm">🔍 Google</span>
                        </label>
                      </div>
                    </div>

                    {/* Inspiration Ads Toggle */}
                    {savedAds.length > 0 && (
                      <div className="pt-3 border-t border-border/50">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <Checkbox 
                            checked={useInspoAds} 
                            onCheckedChange={(checked) => setUseInspoAds(!!checked)}
                          />
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-primary" />
                            <span className="text-sm">Use saved ads for inspiration</span>
                            <Badge variant="secondary" className="text-xs">
                              {savedAds.length} saved
                            </Badge>
                          </div>
                        </label>
                        <p className="text-xs text-muted-foreground mt-1 ml-7">
                          AI will incorporate styles and hooks from your saved ad library
                        </p>
                      </div>
                    )}
                  </div>
                </form>

                {/* Loading State */}
                {isAnalyzing && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                        <Wand2 className="w-8 h-8 text-purple-400 animate-pulse" />
                      </div>
                      <div className="absolute inset-0 rounded-2xl animate-ping bg-purple-500/10" />
                    </div>
                    <p className="text-muted-foreground">Scraping website and analyzing brand...</p>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">Extracting Content</Badge>
                      <Badge variant="outline">Analyzing Brand</Badge>
                      <Badge variant="outline">Building Insights</Badge>
                    </div>
                  </div>
                )}

                {/* Features */}
                {!isAnalyzing && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <div className="glass-card p-6 rounded-xl text-center space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-400" />
                      </div>
                      <h3 className="font-semibold">Brand Analysis</h3>
                      <p className="text-sm text-muted-foreground">
                        Extract features, USPs, and customer personas automatically
                      </p>
                    </div>
                    <div className="glass-card p-6 rounded-xl text-center space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <Palette className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="font-semibold">Pick & Choose</h3>
                      <p className="text-sm text-muted-foreground">
                        Select exactly which insights to include in your ads
                      </p>
                    </div>
                    <div className="glass-card p-6 rounded-xl text-center space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Target className="w-6 h-6 text-orange-400" />
                      </div>
                      <h3 className="font-semibold">Personalized Ads</h3>
                      <p className="text-sm text-muted-foreground">
                        Generate ads tailored to your selected angles and personas
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Insights */}
            {step === 'select' && brandAnalysis && (
              <div className="max-w-5xl mx-auto">
                {metadata && (
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <Badge variant="outline">{metadata.title || metadata.url}</Badge>
                  </div>
                )}
                <BrandInsightSelector 
                  analysis={brandAnalysis}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                />
              </div>
            )}

            {/* Step 3: Generated Ads */}
            {step === 'results' && (
              <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Generated Ads ({generatedAds.length})
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => exportAds('csv')}>
                      <Download className="w-4 h-4 mr-1.5" />
                      CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportAds('json')}>
                      <FileJson className="w-4 h-4 mr-1.5" />
                      JSON
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setStep('select')}>
                      Regenerate
                    </Button>
                    <Button size="sm" onClick={handleStartOver}>
                      New Analysis
                    </Button>
                  </div>
                </div>

                {generatedAds.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {generatedAds.map((ad, index) => (
                      <GeneratedAdCard key={index} ad={ad} index={index} />
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No ads generated</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Something went wrong. Try adjusting your selections and regenerating.
                    </p>
                  </Card>
                )}
              </div>
            )}

            {/* Tool Cards */}
            <ToolCards exclude={['ads', 'generator', 'content-remix']} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdGenerator;
