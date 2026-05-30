import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GeneratedAd } from '@/lib/api/adGenerator';
import { Copy, Check, Sparkles, Target, MessageSquare, Zap, TrendingUp, Smartphone, Monitor, LayoutGrid } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GeneratedAdCardProps {
  ad: GeneratedAd;
  index: number;
}

const platformColors: Record<string, string> = {
  tiktok: 'bg-pink-500/10 text-pink-500 border-pink-500/30',
  TikTok: 'bg-pink-500/10 text-pink-500 border-pink-500/30',
  meta: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  Meta: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  google: 'bg-green-500/10 text-green-500 border-green-500/30',
  Google: 'bg-green-500/10 text-green-500 border-green-500/30',
};

const platformIcons: Record<string, string> = {
  tiktok: '🎵',
  TikTok: '🎵',
  meta: '📘',
  Meta: '📘',
  google: '🔍',
  Google: '🔍',
};

const variantColors: Record<string, string> = {
  A: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  B: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  C: 'bg-violet-500/10 text-violet-500 border-violet-500/30',
};

const hookTypeIcons: Record<string, string> = {
  question: '❓',
  statistic: '📊',
  story: '📖',
  problem: '🎯',
  benefit: '✨',
};

// Platform mockup preview components
const TikTokMockup = ({ ad }: { ad: GeneratedAd }) => (
  <div className="bg-black rounded-2xl p-3 text-white max-w-[280px] mx-auto">
    <div className="aspect-[9/16] bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl relative overflow-hidden">
      {/* Video placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-gray-400 text-xs">
          <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Ad Creative
        </div>
      </div>
      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-xs font-medium mb-1">@brand</p>
        <p className="text-xs line-clamp-2">{ad.primaryText}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs bg-pink-500 px-2 py-0.5 rounded">{ad.callToAction}</span>
        </div>
      </div>
      {/* Side icons */}
      <div className="absolute right-2 bottom-20 flex flex-col gap-3 items-center">
        <div className="w-8 h-8 rounded-full bg-white/20" />
        <span className="text-xs">❤️ 12.5K</span>
        <span className="text-xs">💬 892</span>
        <span className="text-xs">↗️ Share</span>
      </div>
    </div>
  </div>
);

const MetaMockup = ({ ad }: { ad: GeneratedAd }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-border max-w-[320px] mx-auto shadow-sm">
    <div className="p-3 flex items-center gap-2 border-b border-border">
      <div className="w-8 h-8 rounded-full bg-blue-500" />
      <div>
        <p className="text-xs font-semibold">Brand Name</p>
        <p className="text-xs text-muted-foreground">Sponsored</p>
      </div>
    </div>
    <div className="p-3">
      <p className="text-sm mb-3 line-clamp-3">{ad.primaryText}</p>
    </div>
    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
      <Monitor className="w-10 h-10 text-muted-foreground opacity-30" />
    </div>
    <div className="p-3 border-t border-border">
      <p className="text-xs text-muted-foreground mb-1">BRAND.COM</p>
      <p className="text-sm font-semibold line-clamp-1">{ad.headline}</p>
      <Button size="sm" className="w-full mt-2 h-8 text-xs">{ad.callToAction}</Button>
    </div>
  </div>
);

const GoogleMockup = ({ ad }: { ad: GeneratedAd }) => (
  <div className="bg-white dark:bg-gray-900 rounded-lg border border-border max-w-[400px] mx-auto p-4 shadow-sm">
    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
      <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-medium">Ad</span>
      <span>brand.com</span>
    </div>
    <h3 className="text-blue-600 dark:text-blue-400 text-base font-medium hover:underline cursor-pointer line-clamp-1">
      {ad.headline}
    </h3>
    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ad.primaryText}</p>
  </div>
);

export const GeneratedAdCard = ({ ad, index }: GeneratedAdCardProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showMockup, setShowMockup] = useState(false);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyFullAd = async () => {
    const fullAd = `${ad.headline}\n\n${ad.primaryText}\n\n${ad.callToAction}`;
    await copyToClipboard(fullAd, 'full');
  };

  const engagementColor = (ad.estimatedEngagement || 0) >= 80 
    ? 'text-green-500' 
    : (ad.estimatedEngagement || 0) >= 60 
      ? 'text-amber-500' 
      : 'text-red-500';

  return (
    <Card 
      className="p-5 hover:border-primary/20 transition-all opacity-0 animate-fade-in bg-card/50 backdrop-blur-sm"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="space-y-4">
        {/* Header with variant and engagement */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">{platformIcons[ad.platform] || '📢'}</span>
            <Badge className={platformColors[ad.platform] || 'bg-gray-500/10 text-gray-500'}>
              {ad.platform}
            </Badge>
            {ad.variant && (
              <Badge className={variantColors[ad.variant] || 'bg-gray-500/10'}>
                Variant {ad.variant}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {ad.format}
            </Badge>
            {ad.hookType && (
              <Badge variant="secondary" className="text-xs">
                {hookTypeIcons[ad.hookType] || '💡'} {ad.hookType}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {ad.estimatedEngagement && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className={`flex items-center gap-1 text-sm font-medium ${engagementColor}`}>
                      <TrendingUp className="w-4 h-4" />
                      {ad.estimatedEngagement}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Estimated engagement score</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => setShowMockup(!showMockup)}>
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle preview</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={copyFullAd}>
                    {copiedField === 'full' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy full ad</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Platform Mockup Preview */}
        {showMockup && (
          <div className="py-4 bg-muted/30 rounded-xl">
            {ad.platform.toLowerCase() === 'tiktok' && <TikTokMockup ad={ad} />}
            {ad.platform.toLowerCase() === 'meta' && <MetaMockup ad={ad} />}
            {ad.platform.toLowerCase() === 'google' && <GoogleMockup ad={ad} />}
          </div>
        )}

        {/* Hook */}
        <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
          <div className="flex items-center gap-2 text-xs text-primary mb-1">
            <Sparkles className="w-3 h-3" />
            <span className="font-medium">Hook</span>
            {ad.hookType && <span className="opacity-70">({ad.hookType})</span>}
          </div>
          <p className="text-sm font-medium">{ad.hook}</p>
        </div>

        {/* Headline */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Headline</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => copyToClipboard(ad.headline, 'headline')}
            >
              {copiedField === 'headline' ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
          <h3 className="font-bold text-lg">{ad.headline}</h3>
        </div>

        {/* Primary Text */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Primary Text</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => copyToClipboard(ad.primaryText, 'primaryText')}
            >
              {copiedField === 'primaryText' ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{ad.primaryText}</p>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2">
          <Button size="sm" className="pointer-events-none">
            {ad.callToAction}
          </Button>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" className="text-xs">
                  <Target className="w-3 h-3 mr-1" />
                  {ad.targetPersona}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Target Persona</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="secondary" className="text-xs">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {ad.marketingAngle}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Marketing Angle</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </Card>
  );
};
