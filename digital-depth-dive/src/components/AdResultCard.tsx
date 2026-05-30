import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdResult, AdMetrics } from '@/lib/api/adLibrary';
import { ExternalLink, Copy, Check, Bookmark, BookmarkCheck, Camera, DollarSign, Users, TrendingUp, Eye } from 'lucide-react';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AdResultCardProps {
  ad: AdResult;
  index: number;
  onSave?: (ad: AdResult, screenshotUrl?: string) => void;
  isSaved?: boolean;
}

const platformColors: Record<string, string> = {
  TikTok: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  Meta: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Google: 'bg-green-500/10 text-green-400 border-green-500/30',
  General: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

const formatNumber = (num: number | null | undefined): string => {
  if (num == null) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatCurrency = (num: number | null | undefined): string => {
  if (num == null) return '$0';
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num}`;
};

export const AdResultCard = ({ ad, index, onSave, isSaved = false }: AdResultCardProps) => {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [capturing, setCapturing] = useState(false);

  const copyAdCopy = async () => {
    await navigator.clipboard.writeText(ad.adCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!onSave || saved) return;
    setSaving(true);
    
    // Simply save without screenshot for now (screenshot API would require additional setup)
    onSave(ad);
    setSaved(true);
    setSaving(false);
  };

  const handleCaptureAndSave = async () => {
    if (!onSave || saved) return;
    setCapturing(true);
    
    // In a real implementation, we'd capture a screenshot of the ad
    // For now, we'll save with a placeholder or the media URL if available
    const screenshotUrl = ad.mediaUrl || undefined;
    onSave(ad, screenshotUrl);
    setSaved(true);
    setCapturing(false);
  };

  const metrics = ad.metrics;

  return (
    <div 
      className="glass-card rounded-xl p-5 hover:border-primary/20 transition-all opacity-0 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={platformColors[ad.platform] || platformColors.General}>
              {ad.platform}
            </Badge>
            <span className="text-sm font-medium text-primary truncate">{ad.advertiser}</span>
          </div>
          
          <h3 className="font-semibold text-sm mb-2 line-clamp-2">{ad.adTitle}</h3>
          
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
            {ad.adCopy || 'No ad copy available'}
          </p>

          {/* Metrics Section */}
          {metrics && (
            <div className="flex flex-wrap gap-3 mb-3">
              <TooltipProvider>
                {metrics.estimatedSpend && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-1.5 text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-md">
                        <DollarSign className="w-3 h-3" />
                        <span>{formatCurrency(metrics.estimatedSpend.min)}-{formatCurrency(metrics.estimatedSpend.max)}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Estimated Ad Spend</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {metrics.estimatedReach && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-1.5 text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md">
                        <Users className="w-3 h-3" />
                        <span>{formatNumber(metrics.estimatedReach.min)}-{formatNumber(metrics.estimatedReach.max)}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Estimated Reach</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {metrics.impressions && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-1.5 text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded-md">
                        <Eye className="w-3 h-3" />
                        <span>{formatNumber(metrics.impressions)}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Impressions</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {metrics.engagementRate && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-1.5 text-xs bg-orange-500/10 text-orange-400 px-2 py-1 rounded-md">
                        <TrendingUp className="w-3 h-3" />
                        <span>{metrics.engagementRate.toFixed(1)}%</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Engagement Rate</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {ad.dateRange && (
              <span className="bg-muted px-2 py-1 rounded">📅 {ad.dateRange}</span>
            )}
            {ad.landingPage && (
              <a 
                href={ad.landingPage} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-muted px-2 py-1 rounded hover:bg-primary/10 transition-colors truncate max-w-[200px]"
              >
                🔗 {new URL(ad.landingPage).hostname}
              </a>
            )}
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          {onSave && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${saved ? 'text-primary' : ''}`}
                    onClick={handleSave}
                    disabled={saving || saved}
                  >
                    {saved ? (
                      <BookmarkCheck className="w-4 h-4" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{saved ? 'Saved to library' : 'Save to library'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={copyAdCopy}
            title="Copy ad copy"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            asChild
          >
            <a 
              href={ad.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              title="View source"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};
