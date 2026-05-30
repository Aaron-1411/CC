import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { analysesApi, SavedAnalysis } from '@/lib/api/analyses';
import { rebuilderApi, RebuilderOperation } from '@/lib/api/rebuilder';
import { leadSearchesApi, SavedLeadSearch } from '@/lib/api/leadSearches';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3, Users, Hammer, Loader2, Search, Clock, ArrowRight,
  Megaphone, Wand2, Filter, FileText, ExternalLink, Folder, TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SavedAd {
  advertiser: string;
  platform: string;
  adTitle: string;
  adCopy: string;
  landingPage?: string;
  sourceUrl: string;
  savedAt: string;
  screenshotUrl?: string;
}

type ActivityType = 'all' | 'analyses' | 'leads' | 'rebuilds' | 'ads';

interface ActivityItem {
  id: string;
  type: 'analysis' | 'lead_search' | 'rebuild' | 'saved_ad';
  title: string;
  subtitle: string;
  timestamp: Date;
  icon: typeof BarChart3;
  iconColor: string;
  href?: string;
  metadata?: Record<string, unknown>;
  thumbnail?: string;
  score?: number;
  count?: number;
}

const SAVED_ADS_KEY = 'saved_ads_library';

const Activity = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [leadSearches, setLeadSearches] = useState<SavedLeadSearch[]>([]);
  const [rebuilds, setRebuilds] = useState<RebuilderOperation[]>([]);
  const [savedAds, setSavedAds] = useState<SavedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState<ActivityType>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    
    // Load saved ads from localStorage
    try {
      const storedAds = localStorage.getItem(SAVED_ADS_KEY);
      if (storedAds) {
        setSavedAds(JSON.parse(storedAds));
      }
    } catch (e) {
      console.error('Failed to parse saved ads:', e);
    }

    // Load from database
    const [analysesResult, rebuildsResult, leadsResult] = await Promise.all([
      analysesApi.list(),
      rebuilderApi.list(),
      leadSearchesApi.list(),
    ]);

    if (analysesResult.success && analysesResult.data) {
      setAnalyses(analysesResult.data);
    }
    if (rebuildsResult.success && rebuildsResult.data) {
      setRebuilds(rebuildsResult.data);
    }
    if (leadsResult.success && leadsResult.data) {
      setLeadSearches(leadsResult.data);
    }
    
    setLoading(false);
  };

  // Build unified timeline
  const activityItems = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    // Add analyses
    analyses.forEach(a => {
      items.push({
        id: `analysis-${a.id}`,
        type: 'analysis',
        title: a.metadata?.title || new URL(a.url).hostname,
        subtitle: a.analyzed_url,
        timestamp: new Date(a.created_at),
        icon: BarChart3,
        iconColor: 'from-teal-500 to-cyan-500',
        href: `/analysis/${a.id}`,
        thumbnail: a.screenshot_url || undefined,
        score: a.analysis_data.overallScore,
      });
    });

    // Add lead searches
    leadSearches.forEach(l => {
      items.push({
        id: `lead-${l.id}`,
        type: 'lead_search',
        title: l.search_query,
        subtitle: l.location ? `${l.location} • ${l.leads_found} leads` : `${l.leads_found} leads found`,
        timestamp: new Date(l.created_at),
        icon: Users,
        iconColor: 'from-blue-500 to-indigo-500',
        href: '/leads',
        count: l.leads_found,
      });
    });

    // Add rebuilds
    rebuilds.forEach(r => {
      items.push({
        id: `rebuild-${r.id}`,
        type: 'rebuild',
        title: r.extracted_info?.businessName || r.original_title || 'Untitled Rebuild',
        subtitle: r.url,
        timestamp: new Date(r.created_at),
        icon: Hammer,
        iconColor: 'from-orange-500 to-amber-500',
        href: `/rebuild/${r.id}`,
        thumbnail: r.screenshot_url || undefined,
      });
    });

    // Add saved ads
    savedAds.forEach((ad, i) => {
      items.push({
        id: `ad-${i}-${ad.sourceUrl}`,
        type: 'saved_ad',
        title: ad.adTitle || ad.advertiser,
        subtitle: `${ad.platform} • ${ad.advertiser}`,
        timestamp: new Date(ad.savedAt),
        icon: Megaphone,
        iconColor: 'from-pink-500 to-rose-500',
        href: ad.sourceUrl,
        thumbnail: ad.screenshotUrl,
      });
    });

    // Sort by timestamp descending
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [analyses, leadSearches, rebuilds, savedAds]);

  // Filter and search
  const filteredItems = useMemo(() => {
    let result = [...activityItems];

    // Apply type filter
    if (activityFilter !== 'all') {
      const typeMap: Record<ActivityType, string> = {
        all: '',
        analyses: 'analysis',
        leads: 'lead_search',
        rebuilds: 'rebuild',
        ads: 'saved_ad',
      };
      result = result.filter(item => item.type === typeMap[activityFilter]);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query)
      );
    }

    return result;
  }, [activityItems, activityFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: activityItems.length,
    analyses: analyses.length,
    leads: leadSearches.length,
    rebuilds: rebuilds.length,
    ads: savedAds.length,
  }), [activityItems, analyses, leadSearches, rebuilds, savedAds]);

  const typeConfig: Record<string, { label: string; badge: string }> = {
    analysis: { label: 'Analysis', badge: 'bg-teal-500/10 text-teal-600 border-teal-500/30' },
    lead_search: { label: 'Lead Search', badge: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
    rebuild: { label: 'Rebuild', badge: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
    saved_ad: { label: 'Saved Ad', badge: 'bg-pink-500/10 text-pink-600 border-pink-500/30' },
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        <AppHeader />

        <main className="container py-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Activity</h1>
              <p className="text-muted-foreground">
                Your unified timeline of analyses, leads, rebuilds, and saved ads.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/dashboard">
                  <Folder className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            <div className="glass-card rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total Actions</div>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-teal-600">{stats.analyses}</div>
              <div className="text-xs text-muted-foreground">Analyses</div>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.leads}</div>
              <div className="text-xs text-muted-foreground">Lead Searches</div>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.rebuilds}</div>
              <div className="text-xs text-muted-foreground">Rebuilds</div>
            </div>
            <div className="glass-card rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-pink-600">{stats.ads}</div>
              <div className="text-xs text-muted-foreground">Saved Ads</div>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-card rounded-xl p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search activity..."
                  className="pl-10 bg-secondary/50 border-0"
                />
              </div>
              <Select value={activityFilter} onValueChange={(v) => setActivityFilter(v as ActivityType)}>
                <SelectTrigger className="w-[160px] bg-secondary/50 border-0">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activity</SelectItem>
                  <SelectItem value="analyses">Analyses</SelectItem>
                  <SelectItem value="leads">Lead Searches</SelectItem>
                  <SelectItem value="rebuilds">Rebuilds</SelectItem>
                  <SelectItem value="ads">Saved Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Activity Timeline */}
          {filteredItems.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary/50 flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {activityItems.length === 0 ? 'No activity yet' : 'No matching results'}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {activityItems.length === 0 
                  ? 'Start using the tools to see your activity here.'
                  : 'Try adjusting your search or filters.'}
              </p>
              {activityItems.length === 0 && (
                <div className="flex items-center justify-center gap-3">
                  <Button asChild>
                    <Link to="/analyze">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analyze
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/leads">
                      <Users className="w-4 h-4 mr-2" />
                      Find Leads
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const config = typeConfig[item.type];
                const isExternal = item.type === 'saved_ad';

                const CardContent = (
                  <div className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-all group">
                    {/* Thumbnail or Icon */}
                    <div className="flex-shrink-0">
                      {item.thumbnail ? (
                        <div className="w-14 h-14 rounded-lg bg-secondary overflow-hidden">
                          <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.iconColor} flex items-center justify-center`}>
                          <item.icon className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-xs ${config.badge}`}>
                          {config.label}
                        </Badge>
                        {item.score !== undefined && (
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                            item.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {item.score}
                          </span>
                        )}
                        {item.count !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            {item.count} leads
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold truncate">{item.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
                    </div>

                    {/* Timestamp & Arrow */}
                    <div className="flex flex-col items-end gap-2 text-right">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                      </span>
                      {isExternal ? (
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      )}
                    </div>
                  </div>
                );

                return isExternal ? (
                  <a key={item.id} href={item.href} target="_blank" rel="noopener noreferrer">
                    {CardContent}
                  </a>
                ) : (
                  <Link key={item.id} to={item.href!}>
                    {CardContent}
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Activity;
