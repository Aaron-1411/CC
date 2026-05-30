import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppHeader } from '@/components/AppHeader';
import { ToolCards } from '@/components/ToolCards';
import { SuiteTabNav } from '@/components/SuiteTabNav';
import { AdResultCard } from '@/components/AdResultCard';
import { SavedAdsLibrary, useSavedAds } from '@/components/SavedAdsLibrary';
import { adLibraryApi, AdResult, AdPlatform, AdSearchStats } from '@/lib/api/adLibrary';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Loader2, 
  Megaphone,
  AlertCircle,
  TrendingUp,
  Eye,
  Sparkles,
  DollarSign,
  Users
} from 'lucide-react';

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatCurrency = (num: number): string => {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num}`;
};

const AdLibrary = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AdResult[]>([]);
  const [stats, setStats] = useState<AdSearchStats | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<AdPlatform[]>(['all']);
  
  const { savedAds, saveAd, removeAd, isAdSaved, clearAll } = useSavedAds();

  const togglePlatform = (platform: AdPlatform) => {
    if (platform === 'all') {
      setSelectedPlatforms(['all']);
    } else {
      setSelectedPlatforms(prev => {
        const newPlatforms = prev.filter(p => p !== 'all');
        if (newPlatforms.includes(platform)) {
          const filtered = newPlatforms.filter(p => p !== platform);
          return filtered.length === 0 ? ['all'] : filtered;
        }
        return [...newPlatforms, platform];
      });
    }
  };

  const handleSaveAd = (ad: AdResult, screenshotUrl?: string) => {
    saveAd(ad, screenshotUrl);
    toast({
      title: 'Saved!',
      description: 'Ad added to your inspiration library',
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      toast({
        title: 'Search Required',
        description: 'Please enter a brand name or keyword to search',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setResults([]);
    setStats(null);
    setHasSearched(true);

    try {
      const result = await adLibraryApi.search({
        query: trimmedQuery,
        platforms: selectedPlatforms,
        industry: industry.trim() || undefined,
        limit: 30,
      });

      if (!result.success) {
        throw new Error(result.error || 'Search failed');
      }

      setResults(result.results || []);
      setStats(result.stats || null);

      if ((result.results?.length || 0) === 0) {
        toast({
          title: 'No Ads Found',
          description: 'Try different keywords or check a different platform.',
        });
      } else {
        toast({
          title: 'Ads Found!',
          description: `Found ${result.results?.length} ads across platforms`,
        });
      }
    } catch (error) {
      console.error('Ad search error:', error);
      toast({
        title: 'Search Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-pink-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full" />
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 text-pink-400 text-sm font-medium">
                Competitive Ad Intelligence
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Ad <span className="gradient-text">Library</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Search TikTok, Meta, and Google ad libraries to discover competitor ads, 
                creative inspiration, and marketing strategies in your industry.
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto space-y-4">
              <div className="glass-card p-4 rounded-2xl">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Brand name or keyword (e.g., Nike, Shopify)"
                      className="pl-12 h-12 bg-muted/50 border-0 text-base"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="relative flex-1">
                    <Megaphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="Industry (optional, e.g., fitness, SaaS)"
                      className="pl-12 h-12 bg-muted/50 border-0 text-base"
                      disabled={isLoading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="h-12 px-8"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Searching
                      </>
                    ) : (
                      'Search Ads'
                    )}
                  </Button>
                </div>
              </div>

              {/* Platform Selection */}
              <div className="glass-card p-4 rounded-xl">
                <p className="text-sm font-medium mb-3">Select Platforms</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={selectedPlatforms.includes('all')} 
                      onCheckedChange={() => togglePlatform('all')}
                    />
                    <span className="text-sm">All Platforms</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={selectedPlatforms.includes('tiktok') || selectedPlatforms.includes('all')} 
                      onCheckedChange={() => togglePlatform('tiktok')}
                      disabled={selectedPlatforms.includes('all')}
                    />
                    <span className="text-sm">🎵 TikTok</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={selectedPlatforms.includes('meta') || selectedPlatforms.includes('all')} 
                      onCheckedChange={() => togglePlatform('meta')}
                      disabled={selectedPlatforms.includes('all')}
                    />
                    <span className="text-sm">📘 Meta (Facebook/Instagram)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={selectedPlatforms.includes('google') || selectedPlatforms.includes('all')} 
                      onCheckedChange={() => togglePlatform('google')}
                      disabled={selectedPlatforms.includes('all')}
                    />
                    <span className="text-sm">🔍 Google</span>
                  </label>
                </div>
              </div>
            </form>

            {/* Stats Bar */}
            {stats && results.length > 0 && (
              <div className="glass-card p-4 rounded-xl max-w-4xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-primary" />
                      <span className="font-semibold">{stats.total}</span>
                      <span className="text-muted-foreground text-sm">ads found</span>
                    </div>
                    {stats.byPlatform.tiktok > 0 && (
                      <Badge variant="outline" className="bg-pink-500/10 text-pink-400">
                        TikTok: {stats.byPlatform.tiktok}
                      </Badge>
                    )}
                    {stats.byPlatform.meta > 0 && (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400">
                        Meta: {stats.byPlatform.meta}
                      </Badge>
                    )}
                    {stats.byPlatform.google > 0 && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-400">
                        Google: {stats.byPlatform.google}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Aggregate Metrics */}
                  <div className="flex items-center gap-4">
                    {stats.avgEstimatedSpend && stats.avgEstimatedSpend.max > 0 && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-muted-foreground">Avg Spend:</span>
                        <span className="font-medium">{formatCurrency(stats.avgEstimatedSpend.min)}-{formatCurrency(stats.avgEstimatedSpend.max)}</span>
                      </div>
                    )}
                    {stats.totalEstimatedReach && stats.totalEstimatedReach.max > 0 && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-muted-foreground">Total Reach:</span>
                        <span className="font-medium">{formatNumber(stats.totalEstimatedReach.min)}-{formatNumber(stats.totalEstimatedReach.max)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center">
                    <Megaphone className="w-8 h-8 text-pink-400 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl animate-ping bg-pink-500/10" />
                </div>
                <p className="text-muted-foreground">Searching ad libraries across platforms...</p>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">TikTok Ads</Badge>
                  <Badge variant="outline">Meta Ads</Badge>
                  <Badge variant="outline">Google Ads</Badge>
                </div>
              </div>
            )}

            {/* Results */}
            {!isLoading && hasSearched && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {results.length > 0 
                      ? `${results.length} Ad${results.length !== 1 ? 's' : ''} Found`
                      : 'No Ads Found'
                    }
                  </h2>
                  <SavedAdsLibrary 
                    savedAds={savedAds} 
                    onRemove={removeAd} 
                    onClear={clearAll}
                  />
                </div>

                {results.length > 0 ? (
                  <div className="grid gap-4">
                    {results.map((ad, index) => (
                      <AdResultCard 
                        key={`${ad.sourceUrl}-${index}`} 
                        ad={ad} 
                        index={index}
                        onSave={handleSaveAd}
                        isSaved={isAdSaved(ad.sourceUrl)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-12 rounded-2xl text-center">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No ads found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Try a different brand name, industry keyword, or platform combination.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !hasSearched && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="glass-card p-6 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-pink-500/10 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-pink-400" />
                  </div>
                  <h3 className="font-semibold">Competitor Research</h3>
                  <p className="text-sm text-muted-foreground">
                    See what ads your competitors are running across major platforms
                  </p>
                </div>
                <div className="glass-card p-6 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="font-semibold">Creative Inspiration</h3>
                  <p className="text-sm text-muted-foreground">
                    Find winning ad copy, hooks, and creative strategies to adapt
                  </p>
                </div>
                <div className="glass-card p-6 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="font-semibold">Industry Trends</h3>
                  <p className="text-sm text-muted-foreground">
                    Track advertising trends and messaging patterns in your niche
                  </p>
                </div>
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

export default AdLibrary;
