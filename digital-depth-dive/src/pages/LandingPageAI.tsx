import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/AppHeader';
import { ToolCards } from '@/components/ToolCards';
import { SuiteTabNav } from '@/components/SuiteTabNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileCode, Loader2, Download, Eye, Copy, Check,
  Lightbulb, Wand2, Layout, Sparkles
} from 'lucide-react';
import { RebuildPreviewModal } from '@/components/RebuildPreviewModal';

type LandingPageResult = {
  html: string;
  variants: {
    headline: string;
    subheadline: string;
    cta: string;
  }[];
  conversionTips: string[];
  abTestSuggestions: string[];
};

const LandingPageAI = () => {
  const { toast } = useToast();
  const [productDescription, setProductDescription] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [targetAudience, setTargetAudience] = useState('general');
  const [style, setStyle] = useState('modern');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LandingPageResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!productDescription.trim()) {
      toast({ title: 'Product description is required', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('landing-page-generate', {
        body: {
          productDescription,
          businessName: businessName.trim() || 'Your Brand',
          targetAudience,
          style,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setResult(data.result);
      toast({
        title: '✅ Landing Page Generated!',
        description: 'Your conversion-optimized page is ready',
      });
    } catch (error) {
      console.error('Landing page generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadHtml = () => {
    if (!result?.html) return;
    const blob = new Blob([result.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessName || 'landing-page'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded!', description: 'HTML file saved' });
  };

  const copyHtml = async () => {
    if (!result?.html) return;
    await navigator.clipboard.writeText(result.html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied to clipboard!' });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-rose-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-red-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10">
        <AppHeader />

        <main className="container pb-20">
          {/* Suite Tab Navigation */}
          <div className="pt-6 pb-4">
            <SuiteTabNav suite="pages" />
          </div>

          <div className="py-8 md:py-12 space-y-12">
            {/* Hero */}
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-medium">
                <Wand2 className="w-4 h-4" />
                AI-Powered Page Builder
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                Landing Page <span className="gradient-text">AI</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                Generate high-converting landing pages from a single product description. 
                Get headline variants and A/B test suggestions automatically.
              </p>
            </div>

            {/* Input Form */}
            <div className="max-w-2xl mx-auto">
              <div className="glass-card p-6 rounded-2xl space-y-6">
                <div>
                  <Label htmlFor="business" className="mb-2 block">Business Name</Label>
                  <Input
                    id="business"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g., Acme Inc"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="mb-2 block">Product/Service Description *</Label>
                  <Textarea
                    id="description"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Describe your product, its features, benefits, and what problem it solves..."
                    className="min-h-[120px] resize-none"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label className="mb-3 block">Target Audience</Label>
                  <RadioGroup
                    value={targetAudience}
                    onValueChange={setTargetAudience}
                    className="flex flex-wrap gap-4"
                    disabled={isLoading}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="general" id="general" />
                      <Label htmlFor="general" className="cursor-pointer">General</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="b2b" id="b2b" />
                      <Label htmlFor="b2b" className="cursor-pointer">B2B</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="b2c" id="b2c" />
                      <Label htmlFor="b2c" className="cursor-pointer">B2C</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="startup" id="startup" />
                      <Label htmlFor="startup" className="cursor-pointer">Startup</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="mb-3 block">Style</Label>
                  <RadioGroup
                    value={style}
                    onValueChange={setStyle}
                    className="flex flex-wrap gap-4"
                    disabled={isLoading}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="modern" id="modern" />
                      <Label htmlFor="modern" className="cursor-pointer">Modern</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="minimal" id="minimal" />
                      <Label htmlFor="minimal" className="cursor-pointer">Minimal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bold" id="bold" />
                      <Label htmlFor="bold" className="cursor-pointer">Bold</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button onClick={handleGenerate} disabled={isLoading} className="w-full h-12">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Landing Page...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Landing Page
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Results */}
            {result && !isLoading && (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Actions */}
                <div className="glass-card rounded-xl p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <Layout className="w-5 h-5 text-primary" />
                        Your Landing Page is Ready
                      </h3>
                      <p className="text-sm text-muted-foreground">Conversion-optimized and responsive</p>
                    </div>
                    <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                      <Button variant="outline" onClick={() => setShowPreview(true)} className="flex-1 sm:flex-none">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" onClick={copyHtml} className="flex-1 sm:flex-none">
                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        Copy
                      </Button>
                      <Button onClick={downloadHtml} className="flex-1 sm:flex-none">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Headline Variants */}
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Headline Variants (A/B Test These)
                  </h3>
                  <div className="space-y-4">
                    {result.variants.map((variant, i) => (
                      <div key={i} className="p-4 bg-muted rounded-lg">
                        <Badge variant="outline" className="mb-2">Variant {i + 1}</Badge>
                        <h4 className="font-semibold mb-1">{variant.headline}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{variant.subheadline}</p>
                        <Badge className="bg-primary/10 text-primary">CTA: {variant.cta}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conversion Tips */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-primary" />
                      Conversion Tips
                    </h3>
                    <ul className="space-y-2">
                      {result.conversionTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="glass-card rounded-xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-primary" />
                      A/B Test Ideas
                    </h3>
                    <ul className="space-y-2">
                      {result.abTestSuggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!result && !isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto px-4">
                <div className="glass-card p-6 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-rose-500/10 flex items-center justify-center">
                    <Wand2 className="w-6 h-6 text-rose-500" />
                  </div>
                  <h3 className="font-semibold">AI Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Transform any product description into a full landing page
                  </p>
                </div>
                <div className="glass-card p-6 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-rose-500/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-rose-500" />
                  </div>
                  <h3 className="font-semibold">Headline Variants</h3>
                  <p className="text-sm text-muted-foreground">
                    Get multiple headline options ready for A/B testing
                  </p>
                </div>
                <div className="glass-card p-6 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-rose-500/10 flex items-center justify-center">
                    <Layout className="w-6 h-6 text-rose-500" />
                  </div>
                  <h3 className="font-semibold">Mobile Responsive</h3>
                  <p className="text-sm text-muted-foreground">
                    Pages are automatically optimized for all devices
                  </p>
                </div>
              </div>
            )}

            <ToolCards exclude={['landing-page', 'rebuild']} />
          </div>
        </main>
      </div>

      {/* Preview Modal */}
      {result && (
        <RebuildPreviewModal
          open={showPreview}
          onOpenChange={setShowPreview}
          rebuild={{
            id: 'preview',
            user_id: '',
            url: '',
            original_title: businessName || 'Landing Page',
            generated_html: result.html,
            brand_colors: null,
            extracted_info: null,
            screenshot_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }}
        />
      )}
    </div>
  );
};

export default LandingPageAI;
