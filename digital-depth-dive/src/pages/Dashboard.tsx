import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { analysesApi, SavedAnalysis } from '@/lib/api/analyses';
import { rebuilderApi, RebuilderOperation } from '@/lib/api/rebuilder';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RebuildPreviewModal } from '@/components/RebuildPreviewModal';
import { 
  Wrench, Plus, Loader2, BarChart3, ExternalLink, Trash2, Share2, 
  Clock, Layers, Users, Copy, Check, Search, Filter, ArrowUpDown, X, Hammer, Globe, Eye, Download, FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = 'newest' | 'oldest' | 'score-high' | 'score-low';
type ScoreFilter = 'all' | 'excellent' | 'good' | 'average' | 'poor';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [rebuilds, setRebuilds] = useState<RebuilderOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('analyses');
  const [previewRebuild, setPreviewRebuild] = useState<RebuilderOperation | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [analysesResult, rebuildsResult] = await Promise.all([
      analysesApi.list(),
      rebuilderApi.list(),
    ]);
    if (analysesResult.success && analysesResult.data) {
      setAnalyses(analysesResult.data);
    }
    if (rebuildsResult.success && rebuildsResult.data) {
      setRebuilds(rebuildsResult.data);
    }
    setLoading(false);
  };

  // Filtered and sorted analyses
  const filteredAnalyses = useMemo(() => {
    let result = [...analyses];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.url.toLowerCase().includes(query) ||
        a.analyzed_url.toLowerCase().includes(query) ||
        a.metadata?.title?.toLowerCase().includes(query)
      );
    }

    // Apply score filter
    if (scoreFilter !== 'all') {
      result = result.filter(a => {
        const score = a.analysis_data.overallScore;
        switch (scoreFilter) {
          case 'excellent': return score >= 80;
          case 'good': return score >= 60 && score < 80;
          case 'average': return score >= 40 && score < 60;
          case 'poor': return score < 40;
          default: return true;
        }
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'score-high':
          return b.analysis_data.overallScore - a.analysis_data.overallScore;
        case 'score-low':
          return a.analysis_data.overallScore - b.analysis_data.overallScore;
        default:
          return 0;
      }
    });

    return result;
  }, [analyses, searchQuery, sortBy, scoreFilter]);

  // Filtered and sorted rebuilds
  const filteredRebuilds = useMemo(() => {
    let result = [...rebuilds];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.url.toLowerCase().includes(query) ||
        r.original_title?.toLowerCase().includes(query) ||
        r.extracted_info?.businessName?.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [rebuilds, searchQuery, sortBy]);

  const handleDeleteAnalysis = async (id: string) => {
    const result = await analysesApi.delete(id);
    if (result.success) {
      setAnalyses(analyses.filter(a => a.id !== id));
      toast({ title: 'Deleted', description: 'Analysis removed from history.' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleDeleteRebuild = async (id: string) => {
    const result = await rebuilderApi.delete(id);
    if (result.success) {
      setRebuilds(rebuilds.filter(r => r.id !== id));
      toast({ title: 'Deleted', description: 'Rebuild removed from history.' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleToggleShare = async (analysis: SavedAnalysis) => {
    const newPublicState = !analysis.is_public;
    const result = await analysesApi.togglePublic(analysis.id, newPublicState);
    
    if (result.success) {
      setAnalyses(analyses.map(a => 
        a.id === analysis.id ? { ...a, is_public: newPublicState } : a
      ));
      
      if (newPublicState && result.shareToken) {
        const shareUrl = `${window.location.origin}/report/${result.shareToken}`;
        navigator.clipboard.writeText(shareUrl);
        setCopiedId(analysis.id);
        setTimeout(() => setCopiedId(null), 2000);
        toast({ 
          title: 'Link Copied', 
          description: 'Share link copied to clipboard.' 
        });
      } else {
        toast({ title: 'Sharing Disabled', description: 'Report is now private.' });
      }
    }
  };

  const copyShareLink = (shareToken: string, id: string) => {
    const shareUrl = `${window.location.origin}/report/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: 'Link Copied', description: 'Share link copied to clipboard.' });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSortBy('newest');
    setScoreFilter('all');
  };

  const hasActiveFilters = searchQuery || sortBy !== 'newest' || scoreFilter !== 'all';

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container py-4">
            <nav className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link to="/toolbox" className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xl font-bold gradient-text">Toolbox</span>
                </Link>
                <div className="hidden md:flex items-center gap-1">
                  <Link
                    to="/analyze"
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
                  >
                    <BarChart3 className="w-4 h-4 inline-block mr-2" />
                    Analyze
                  </Link>
                  <Link
                    to="/leads"
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
                  >
                    <Users className="w-4 h-4 inline-block mr-2" />
                    Lead Finder
                  </Link>
                  <Link
                    to="/rebuild"
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
                  >
                    <Hammer className="w-4 h-4 inline-block mr-2" />
                    Rebuilder
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user?.email}
                </span>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </div>
            </nav>
          </div>
        </header>

        <main className="container py-8">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">
                {analyses.length} analyses · {rebuilds.length} rebuilds
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/rebuild">
                  <Hammer className="w-4 h-4 mr-2" />
                  New Rebuild
                </Link>
              </Button>
              <Button asChild>
                <Link to="/analyze">
                  <Plus className="w-4 h-4 mr-2" />
                  New Analysis
                </Link>
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="analyses" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analyses
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {analyses.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="rebuilds" className="flex items-center gap-2">
                <Hammer className="w-4 h-4" />
                Rebuilds
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {rebuilds.length}
                </span>
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="glass-card rounded-xl p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by URL or title..."
                    className="pl-10 bg-secondary/50 border-0"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {activeTab === 'analyses' && (
                    <Select value={scoreFilter} onValueChange={(v) => setScoreFilter(v as ScoreFilter)}>
                      <SelectTrigger className="w-[140px] bg-secondary/50 border-0">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Score" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Scores</SelectItem>
                        <SelectItem value="excellent">Excellent (80+)</SelectItem>
                        <SelectItem value="good">Good (60-79)</SelectItem>
                        <SelectItem value="average">Average (40-59)</SelectItem>
                        <SelectItem value="poor">Poor (&lt;40)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <SelectTrigger className="w-[160px] bg-secondary/50 border-0">
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      {activeTab === 'analyses' && (
                        <>
                          <SelectItem value="score-high">Highest Score</SelectItem>
                          <SelectItem value="score-low">Lowest Score</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Analyses Tab */}
            <TabsContent value="analyses" className="space-y-4">
              {analyses.length === 0 && (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">No analyses yet</h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start by analyzing a website. Your reports will be saved here for future reference.
                  </p>
                  <Button asChild>
                    <Link to="/analyze">
                      <Plus className="w-4 h-4 mr-2" />
                      Analyze Your First Website
                    </Link>
                  </Button>
                </div>
              )}

              {analyses.length > 0 && filteredAnalyses.length === 0 && (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary/50 flex items-center justify-center mb-6">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">No matching results</h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Try adjusting your search or filters to find what you're looking for.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}

              {filteredAnalyses.length > 0 && (
                <div className="grid gap-4">
                  {filteredAnalyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="glass-card rounded-xl p-5 flex flex-col sm:flex-row gap-4 sm:items-center group hover:border-primary/30 transition-colors"
                    >
                      <div className="w-full sm:w-32 h-20 rounded-lg bg-secondary/50 overflow-hidden flex-shrink-0">
                        {analysis.screenshot_url ? (
                          <img
                            src={analysis.screenshot_url}
                            alt={analysis.metadata?.title || analysis.url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate mb-1">
                          {analysis.metadata?.title || analysis.url}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {analysis.analyzed_url}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}
                          </span>
                          {analysis.pages_analyzed > 1 && (
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {analysis.pages_analyzed} pages
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            analysis.analysis_data.overallScore >= 80 
                              ? 'bg-green-500/10 text-green-400'
                              : analysis.analysis_data.overallScore >= 60
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : analysis.analysis_data.overallScore >= 40
                              ? 'bg-orange-500/10 text-orange-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}>
                            Score: {analysis.analysis_data.overallScore}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          title="Rebuild this site"
                        >
                          <Link to={`/rebuild?url=${encodeURIComponent(analysis.analyzed_url)}`}>
                            <Hammer className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleShare(analysis)}
                          className={analysis.is_public ? 'text-primary' : ''}
                        >
                          {copiedId === analysis.id ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </Button>
                        {analysis.is_public && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyShareLink(analysis.share_token, analysis.id)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAnalysis(analysis.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/analysis/${analysis.id}`}>
                            View
                            <ExternalLink className="w-3 h-3 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Rebuilds Tab */}
            <TabsContent value="rebuilds" className="space-y-4">
              {rebuilds.length === 0 && (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Hammer className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">No rebuilds yet</h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Generate optimized website templates from any URL. Your rebuilds will be saved here.
                  </p>
                  <Button asChild>
                    <Link to="/rebuild">
                      <Hammer className="w-4 h-4 mr-2" />
                      Start Your First Rebuild
                    </Link>
                  </Button>
                </div>
              )}

              {rebuilds.length > 0 && filteredRebuilds.length === 0 && (
                <div className="glass-card rounded-2xl p-12 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary/50 flex items-center justify-center mb-6">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">No matching results</h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Try adjusting your search to find what you're looking for.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}

              {filteredRebuilds.length > 0 && (
                <div className="grid gap-4">
                  {filteredRebuilds.map((rebuild) => (
                    <div
                      key={rebuild.id}
                      className="glass-card rounded-xl p-5 flex flex-col sm:flex-row gap-4 sm:items-center group hover:border-primary/30 transition-colors"
                    >
                      <div className="w-full sm:w-32 h-20 rounded-lg bg-secondary/50 overflow-hidden flex-shrink-0">
                        {rebuild.screenshot_url ? (
                          <img
                            src={rebuild.screenshot_url}
                            alt={rebuild.original_title || rebuild.url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Globe className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate mb-1">
                          {rebuild.original_title || rebuild.url}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {rebuild.url}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(rebuild.created_at), { addSuffix: true })}
                          </span>
                          {rebuild.extracted_info?.industry && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {rebuild.extracted_info.industry}
                            </span>
                          )}
                          {rebuild.brand_colors && (
                            <div className="flex items-center gap-1">
                              <div 
                                className="w-3 h-3 rounded-full border border-border" 
                                style={{ backgroundColor: rebuild.brand_colors.primary }} 
                              />
                              <div 
                                className="w-3 h-3 rounded-full border border-border" 
                                style={{ backgroundColor: rebuild.brand_colors.secondary }} 
                              />
                              <div 
                                className="w-3 h-3 rounded-full border border-border" 
                                style={{ backgroundColor: rebuild.brand_colors.accent }} 
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPreviewRebuild(rebuild);
                            setPreviewModalOpen(true);
                          }}
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const blob = new Blob([rebuild.generated_html], { type: 'text/html' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${rebuild.original_title || 'website'}.html`;
                            a.click();
                            URL.revokeObjectURL(url);
                            toast({ title: 'Downloaded!', description: 'HTML file downloaded.' });
                          }}
                          title="Download HTML"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRebuild(rebuild.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/rebuild?url=${encodeURIComponent(rebuild.url)}`}>
                            Rebuild
                            <Hammer className="w-3 h-3 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>

        {/* Preview Modal */}
        <RebuildPreviewModal
          rebuild={previewRebuild}
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
        />
      </div>
    </div>
  );
};

export default Dashboard;
