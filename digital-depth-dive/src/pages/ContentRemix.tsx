import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '@/components/AppHeader';
import { ToolCards } from '@/components/ToolCards';
import { SuiteTabNav } from '@/components/SuiteTabNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { supabase } from '@/integrations/supabase/client';
import { 
  Layers, Loader2, Copy, Check, Globe, FileText,
  Twitter, Linkedin, Instagram, Video, MessageSquare, Image
} from 'lucide-react';

type ContentVariant = {
  format: string;
  platform: string;
  content: string;
  characterCount: number;
  estimatedPerformance: number;
  hashtags?: string[];
  hook?: string;
};

type RemixResult = {
  originalSummary: string;
  keyPoints: string[];
  variants: ContentVariant[];
  visualSuggestions: {
    format: string;
    description: string;
    dimensions: string;
  }[];
};

const ContentRemix = () => {
  const { toast } = useToast();
  const [inputType, setInputType] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RemixResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleRemix = async () => {
    let content = '';

    if (inputType === 'url') {
      if (!url.trim()) {
        toast({ title: 'URL is required', variant: 'destructive' });
        return;
      }

      setIsLoading(true);
      try {
        const scrapeResult = await firecrawlApi.scrape(url, {
          formats: ['markdown'],
          onlyMainContent: true,
        });

        if (!scrapeResult.success) {
          throw new Error('Failed to fetch content');
        }
        content = scrapeResult.data?.markdown || '';
      } catch (error) {
        toast({
          title: 'Failed to fetch URL',
          description: error instanceof Error ? error.message : 'Something went wrong',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
    } else {
      if (!textContent.trim()) {
        toast({ title: 'Content is required', variant: 'destructive' });
        return;
      }
      content = textContent;
      setIsLoading(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke('content-remix', {
        body: {
          content,
          url: inputType === 'url' ? url : undefined,
          targetPlatforms: ['twitter', 'linkedin', 'instagram', 'tiktok', 'facebook'],
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setResult(data.result);
      toast({
        title: '✅ Content Remixed!',
        description: `Generated ${data.result.variants.length} platform variants`,
      });
    } catch (error) {
      console.error('Content remix error:', error);
      toast({
        title: 'Remix Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyContent = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({ title: 'Copied to clipboard!' });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter/x': return <Twitter className="w-5 h-5" />;
      case 'linkedin': return <Linkedin className="w-5 h-5" />;
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'tiktok': return <Video className="w-5 h-5" />;
      case 'facebook': return <MessageSquare className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-fuchsia-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10">
        <AppHeader />

        <main className="container pb-20">
          {/* Suite Tab Navigation */}
          <div className="pt-6 pb-4">
            <SuiteTabNav suite="ads" />
          </div>

          <div className="py-8 md:py-12 space-y-12">
            {/* Hero */}
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 text-sm font-medium">
                <Layers className="w-4 h-4" />
                Multi-Format Repurposing
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                Content <span className="gradient-text">Remix</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                Turn any blog post or page into multiple ad formats instantly—tweets, LinkedIn posts, 
                Instagram captions, TikTok scripts, and more.
              </p>
            </div>

            {/* Input */}
            <div className="max-w-2xl mx-auto">
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <Tabs value={inputType} onValueChange={(v) => setInputType(v as 'url' | 'text')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url" className="gap-2">
                      <Globe className="w-4 h-4" />
                      From URL
                    </TabsTrigger>
                    <TabsTrigger value="text" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Paste Content
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="url" className="mt-4">
                    <Input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://yourblog.com/article"
                      className="h-12"
                      disabled={isLoading}
                    />
                  </TabsContent>

                  <TabsContent value="text" className="mt-4">
                    <Textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Paste your blog post, article, or any content here..."
                      className="min-h-[200px] resize-none"
                      disabled={isLoading}
                    />
                  </TabsContent>
                </Tabs>

                <Button onClick={handleRemix} disabled={isLoading} className="w-full h-12">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Remixing Content...
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4 mr-2" />
                      Remix into Multiple Formats
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Results */}
            {result && !isLoading && (
              <div className="max-w-5xl mx-auto space-y-6">
                {/* Key Points */}
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Extracted Key Points</h3>
                  <ul className="space-y-2">
                    {result.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary font-medium">{i + 1}.</span>
                        <span className="text-muted-foreground">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Platform Variants */}
                <div className="grid gap-4">
                  {result.variants.map((variant, index) => (
                    <div key={index} className="glass-card rounded-xl p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            {getPlatformIcon(variant.platform)}
                          </div>
                          <div>
                            <h4 className="font-medium">{variant.platform}</h4>
                            <p className="text-sm text-muted-foreground">{variant.format}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{variant.characterCount} chars</Badge>
                          <Badge variant="secondary">
                            {variant.estimatedPerformance}% predicted engagement
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyContent(variant.content, index)}
                          >
                            {copiedIndex === index ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {variant.hook && (
                        <p className="text-sm font-medium text-primary mb-2">Hook: {variant.hook}</p>
                      )}

                      <div className="bg-muted rounded-lg p-4 whitespace-pre-wrap text-sm max-h-[200px] overflow-y-auto">
                        {variant.content}
                      </div>

                      {variant.hashtags && variant.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {variant.hashtags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Visual Suggestions */}
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5 text-primary" />
                    Visual Format Suggestions
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {result.visualSuggestions.map((suggestion, i) => (
                      <div key={i} className="p-4 bg-muted rounded-lg text-center">
                        <div className="text-2xl mb-2">
                          {['📐', '🎨', '📱', '🖼️'][i % 4]}
                        </div>
                        <h4 className="font-medium text-sm">{suggestion.format}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{suggestion.dimensions}</p>
                        <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
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
                  <div className="w-12 h-12 mx-auto rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
                    <Twitter className="w-6 h-6 text-fuchsia-500" />
                  </div>
                  <h3 className="font-semibold">Tweet Threads</h3>
                  <p className="text-sm text-muted-foreground">
                    Auto-generate engaging Twitter/X threads from long-form content
                  </p>
                </div>
                <div className="glass-card p-6 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
                    <Linkedin className="w-6 h-6 text-fuchsia-500" />
                  </div>
                  <h3 className="font-semibold">LinkedIn Posts</h3>
                  <p className="text-sm text-muted-foreground">
                    Professional posts with hooks and engagement-driving CTAs
                  </p>
                </div>
                <div className="glass-card p-6 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
                    <Video className="w-6 h-6 text-fuchsia-500" />
                  </div>
                  <h3 className="font-semibold">TikTok Scripts</h3>
                  <p className="text-sm text-muted-foreground">
                    Ready-to-film video scripts with hooks and CTAs
                  </p>
                </div>
              </div>
            )}

            <ToolCards exclude={['ads', 'generator', 'content-remix']} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContentRemix;
