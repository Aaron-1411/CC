import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AdResult } from '@/lib/api/adLibrary';
import { Folder, Trash2, ExternalLink, Download, Image, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const STORAGE_KEY = 'saved_ads_library';

interface SavedAd extends AdResult {
  savedAt: string;
  screenshotUrl?: string;
  notes?: string;
}

export const useSavedAds = () => {
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedAds(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved ads:', e);
      }
    }
  }, []);

  const saveAd = (ad: AdResult, screenshotUrl?: string) => {
    const newAd: SavedAd = {
      ...ad,
      savedAt: new Date().toISOString(),
      screenshotUrl,
    };
    const updated = [...savedAds, newAd];
    setSavedAds(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  };

  const removeAd = (sourceUrl: string) => {
    const updated = savedAds.filter(ad => ad.sourceUrl !== sourceUrl);
    setSavedAds(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const isAdSaved = (sourceUrl: string) => {
    return savedAds.some(ad => ad.sourceUrl === sourceUrl);
  };

  const clearAll = () => {
    setSavedAds([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { savedAds, saveAd, removeAd, isAdSaved, clearAll };
};

interface SavedAdsLibraryProps {
  savedAds: SavedAd[];
  onRemove: (sourceUrl: string) => void;
  onClear: () => void;
}

export const SavedAdsLibrary = ({ savedAds, onRemove, onClear }: SavedAdsLibraryProps) => {
  const { toast } = useToast();
  const [selectedAd, setSelectedAd] = useState<SavedAd | null>(null);

  const handleExportAll = () => {
    const exportData = savedAds.map(ad => ({
      advertiser: ad.advertiser,
      platform: ad.platform,
      title: ad.adTitle,
      copy: ad.adCopy,
      landingPage: ad.landingPage,
      sourceUrl: ad.sourceUrl,
      savedAt: ad.savedAt,
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ad-library-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Exported!',
      description: `${savedAds.length} ads exported to JSON`,
    });
  };

  const platformColors: Record<string, string> = {
    TikTok: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    Meta: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    Google: 'bg-green-500/10 text-green-400 border-green-500/30',
    General: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Folder className="w-4 h-4" />
          Saved Ads
          {savedAds.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {savedAds.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-primary" />
              Your Inspiration Library
            </span>
            {savedAds.length > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportAll}>
                  <Download className="w-4 h-4 mr-1" />
                  Export All
                </Button>
                <Button variant="ghost" size="sm" onClick={onClear} className="text-destructive hover:text-destructive">
                  Clear All
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {savedAds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No saved ads yet</p>
              <p className="text-sm">Save ads from your search results to build your inspiration library</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {savedAds.map((ad, index) => (
                <div 
                  key={`${ad.sourceUrl}-${index}`}
                  className="glass-card rounded-lg p-4 hover:border-primary/20 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {ad.screenshotUrl && (
                      <div 
                        className="w-24 h-16 rounded bg-muted overflow-hidden cursor-pointer flex-shrink-0"
                        onClick={() => setSelectedAd(ad)}
                      >
                        <img 
                          src={ad.screenshotUrl} 
                          alt="Ad screenshot" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={platformColors[ad.platform] || platformColors.General} variant="outline">
                          {ad.platform}
                        </Badge>
                        <span className="text-sm font-medium truncate">{ad.advertiser}</span>
                      </div>
                      <h4 className="font-medium text-sm line-clamp-1">{ad.adTitle}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{ad.adCopy}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={ad.sourceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onRemove(ad.sourceUrl)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Screenshot Preview Modal */}
        {selectedAd?.screenshotUrl && (
          <Dialog open={!!selectedAd} onOpenChange={() => setSelectedAd(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{selectedAd.adTitle}</DialogTitle>
              </DialogHeader>
              <img 
                src={selectedAd.screenshotUrl} 
                alt="Ad screenshot" 
                className="w-full rounded-lg"
              />
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};
