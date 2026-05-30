import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LeadCard } from '@/components/LeadCard';
import { AppHeader } from '@/components/AppHeader';
import { ToolCards } from '@/components/ToolCards';
import { SuiteTabNav } from '@/components/SuiteTabNav';
import { LeadSearchHistory } from '@/components/LeadSearchHistory';
import { LeadListManager } from '@/components/LeadListManager';
import { leadsApi, Lead, LeadStats } from '@/lib/api/leads';
import { leadSearchesApi, SavedLeadSearch } from '@/lib/api/leadSearches';
import { leadListsApi, LeadList } from '@/lib/api/leadLists';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  MapPin, 
  Loader2, 
  Users, 
  Download,
  AlertCircle,
  Filter,
  FileJson,
  Star,
  Mail,
  Phone,
  TrendingUp,
  Target,
  Zap,
  Save,
  Check,
  FolderOpen,
  FolderPlus
} from 'lucide-react';

type QualityFilter = 'all' | 'high' | 'verified' | 'email' | 'phone';

const LeadFinder = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>('all');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [leadCount, setLeadCount] = useState<number>(25);
  const [listsSheetOpen, setListsSheetOpen] = useState(false);
  const [lists, setLists] = useState<LeadList[]>([]);
  const [addingToList, setAddingToList] = useState(false);

  const leadCountOptions = [10, 25, 50, 100];

  const loadLists = async () => {
    const result = await leadListsApi.getLists();
    if (result.success) {
      setLists(result.data || []);
    }
  };

  const handleAddAllToList = async (listId: string, listName: string) => {
    if (filteredLeads.length === 0) return;
    setAddingToList(true);
    const result = await leadListsApi.addLeadsToList(listId, filteredLeads);
    if (result.success) {
      toast({ title: 'Added!', description: `${filteredLeads.length} leads added to "${listName}"` });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setAddingToList(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedKeyword = keyword.trim();
    const trimmedLocation = location.trim();

    if (!trimmedKeyword) {
      toast({
        title: 'Keyword Required',
        description: 'Please enter a business type or keyword to search',
        variant: 'destructive',
      });
      return;
    }

    if (trimmedKeyword.length > 100) {
      toast({
        title: 'Keyword Too Long',
        description: 'Please use a shorter keyword (max 100 characters)',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setLeads([]);
    setStats(null);
    setHasSearched(true);
    setQualityFilter('all');
    setSaved(false);

    const fullSearchQuery = trimmedLocation 
      ? `${trimmedKeyword} in ${trimmedLocation}`
      : `${trimmedKeyword} near me`;
    
    setLastSearchQuery(fullSearchQuery);

    try {
      const searchResult = await leadsApi.search(fullSearchQuery, { limit: leadCount });

      if (!searchResult.success || !searchResult.data?.length) {
        toast({
          title: 'No Results',
          description: 'No businesses found for this search. Try different keywords.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const extractResult = await leadsApi.extractLeads(searchResult.data);

      if (!extractResult.success) {
        throw new Error(extractResult.error || 'Failed to extract leads');
      }

      setLeads(extractResult.leads || []);
      setStats(extractResult.stats || null);

      if (extractResult.leads?.length === 0) {
        toast({
          title: 'No Contacts Found',
          description: 'Found businesses but no contact information available.',
        });
      } else {
        const highQuality = extractResult.stats?.highQuality || 0;
        toast({
          title: 'Leads Found!',
          description: `Found ${extractResult.leads?.length} leads (${highQuality} high quality)`,
        });
      }
    } catch (error) {
      console.error('Lead search error:', error);
      toast({
        title: 'Search Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    switch (qualityFilter) {
      case 'high':
        return (lead.qualityScore || 0) >= 70;
      case 'verified':
        return lead.email || lead.phone;
      case 'email':
        return !!lead.email;
      case 'phone':
        return !!lead.phone;
      default:
        return true;
    }
  });

  const exportCsv = () => {
    if (filteredLeads.length === 0) return;
    leadsApi.exportToCsv(filteredLeads, `leads-${keyword.replace(/\s+/g, '-')}-${Date.now()}.csv`);
    toast({ title: 'Exported!', description: 'Leads exported to CSV file' });
  };

  const exportJson = () => {
    if (filteredLeads.length === 0) return;
    leadsApi.exportToJson(filteredLeads, `leads-${keyword.replace(/\s+/g, '-')}-${Date.now()}.json`);
    toast({ title: 'Exported!', description: 'Leads exported to JSON file' });
  };

  const handleSaveSearch = async () => {
    if (!user || leads.length === 0) return;
    
    setSaving(true);
    const result = await leadSearchesApi.save({
      searchQuery: lastSearchQuery,
      searchType: 'industry',
      location: location.trim() || undefined,
      leads,
      filtersApplied: qualityFilter !== 'all' ? { quality: qualityFilter } : undefined,
    });

    if (result.success) {
      setSaved(true);
      toast({ title: '✅ Search Saved', description: 'View your saved searches in history.' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleLoadSearch = (search: SavedLeadSearch) => {
    setLeads(search.leads_data);
    setHasSearched(true);
    setLastSearchQuery(search.search_query);
    setStats({
      totalProcessed: search.leads_found,
      leadsFound: search.leads_found,
      withEmail: search.leads_data.filter(l => l.email).length,
      withPhone: search.leads_data.filter(l => l.phone).length,
      highQuality: search.leads_data.filter(l => (l.qualityScore || 0) >= 70).length,
      averageScore: search.leads_found > 0 ? Math.round(search.leads_data.reduce((acc, l) => acc + (l.qualityScore || 0), 0) / search.leads_found) : 0,
    });
    toast({ title: 'Search Loaded', description: `Loaded ${search.leads_found} leads from "${search.search_query}"` });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10">
        <AppHeader />

        <main className="container pb-20">
          {/* Suite Tab Navigation */}
          <div className="pt-6 pb-4">
            <SuiteTabNav suite="outreach" />
          </div>

          <div className="py-8 md:py-12 space-y-12">
            {/* Hero */}
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium">
                Enterprise Lead Generation
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Lead <span className="gradient-text">Finder</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Discover up to 100 qualified business leads per search with verified contact information, 
                quality scoring, and enriched business data. Export to CSV/JSON for CRM integration.
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto">
              <div className="glass-card p-4 rounded-2xl">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="Business type (e.g., plumbers, dentists)"
                      className="pl-12 h-12 bg-muted/50 border-0 text-base"
                      disabled={isLoading}
                      maxLength={100}
                    />
                  </div>
                  <div className="relative flex-1">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Location (e.g., New York)"
                      className="pl-12 h-12 bg-muted/50 border-0 text-base"
                      disabled={isLoading}
                      maxLength={100}
                    />
                  </div>
                  <Select 
                    value={leadCount.toString()} 
                    onValueChange={(v) => setLeadCount(Number(v))}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-[120px] h-12 bg-muted/50 border-0">
                      <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {leadCountOptions.map((count) => (
                        <SelectItem key={count} value={count.toString()}>
                          {count} leads
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      'Find Leads'
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* Stats Bar */}
            {stats && leads.length > 0 && (
              <div className="glass-card p-4 rounded-xl max-w-4xl mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="font-semibold">{stats.leadsFound}</span>
                      <span className="text-muted-foreground text-sm">leads found</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-green-400" />
                      <span className="font-semibold">{stats.withEmail}</span>
                      <span className="text-muted-foreground text-sm">with email</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold">{stats.withPhone}</span>
                      <span className="text-muted-foreground text-sm">with phone</span>
                    </div>
                    {stats.highQuality !== undefined && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="font-semibold">{stats.highQuality}</span>
                        <span className="text-muted-foreground text-sm">high quality</span>
                      </div>
                    )}
                    {stats.averageScore !== undefined && (
                      <Badge variant="outline" className="text-sm">
                        Avg Score: {stats.averageScore}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleSaveSearch}
                          disabled={saving || saved}
                        >
                          {saved ? (
                            <>
                              <Check className="w-4 h-4 mr-1.5" />
                              Saved
                            </>
                          ) : saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-1.5" />
                              Save
                            </>
                          )}
                        </Button>
                        <DropdownMenu onOpenChange={(open) => open && loadLists()}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={addingToList}>
                              {addingToList ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <FolderPlus className="w-4 h-4 mr-1.5" />
                                  Add All to List
                                </>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {lists.length > 0 ? (
                              lists.map(list => (
                                <DropdownMenuItem 
                                  key={list.id}
                                  onClick={() => handleAddAllToList(list.id, list.name)}
                                >
                                  <div 
                                    className="w-3 h-3 rounded-full mr-2" 
                                    style={{ backgroundColor: list.color }}
                                  />
                                  {list.name}
                                </DropdownMenuItem>
                              ))
                            ) : (
                              <div className="p-3 text-sm text-muted-foreground text-center">
                                No lists yet - create one first
                              </div>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={exportCsv}>
                      <Download className="w-4 h-4 mr-1.5" />
                      CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportJson}>
                      <FileJson className="w-4 h-4 mr-1.5" />
                      JSON
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Search className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl animate-ping bg-primary/10" />
                </div>
                <p className="text-muted-foreground">Searching businesses, extracting contacts, and scoring leads...</p>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">Enriching data</Badge>
                  <Badge variant="outline">Validating contacts</Badge>
                  <Badge variant="outline">Deduplicating</Badge>
                </div>
              </div>
            )}

            {/* Results */}
            {!isLoading && hasSearched && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold">
                    {filteredLeads.length > 0 
                      ? `${filteredLeads.length} Lead${filteredLeads.length !== 1 ? 's' : ''}${qualityFilter !== 'all' ? ' (filtered)' : ''}`
                      : 'No Leads Found'
                    }
                  </h2>
                  {leads.length > 0 && (
                    <Select value={qualityFilter} onValueChange={(v) => setQualityFilter(v as QualityFilter)}>
                      <SelectTrigger className="w-[180px] bg-secondary/50 border-0">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Leads</SelectItem>
                        <SelectItem value="high">High Quality (70+)</SelectItem>
                        <SelectItem value="verified">Verified Contact</SelectItem>
                        <SelectItem value="email">Has Email</SelectItem>
                        <SelectItem value="phone">Has Phone</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {filteredLeads.length > 0 ? (
                  <div className="grid gap-4">
                    {filteredLeads.map((lead, index) => (
                      <LeadCard key={`${lead.website}-${index}`} lead={lead} index={index} />
                    ))}
                  </div>
                ) : leads.length > 0 ? (
                  <div className="glass-card p-12 rounded-2xl text-center">
                    <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No leads match this filter</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-4">
                      Try a different filter or view all leads.
                    </p>
                    <Button variant="outline" onClick={() => setQualityFilter('all')}>
                      Show All Leads
                    </Button>
                  </div>
                ) : (
                  <div className="glass-card p-12 rounded-2xl text-center">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No contacts found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Try a different keyword or location.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !hasSearched && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                <div className="glass-card p-6 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">AI-Powered Search</h3>
                  <p className="text-sm text-muted-foreground">
                    Find businesses with intelligent keyword matching and location filtering
                  </p>
                </div>
                <div className="glass-card p-6 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Quality Scoring</h3>
                  <p className="text-sm text-muted-foreground">
                    Each lead scored 0-100 based on data completeness and verification
                  </p>
                </div>
                <div className="glass-card p-6 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">Enriched Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Business signals, decision makers, and social profiles extracted
                  </p>
                </div>
                <div className="glass-card p-6 rounded-xl text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">CRM Ready</h3>
                  <p className="text-sm text-muted-foreground">
                    Export to CSV or JSON with all fields for easy CRM import
                  </p>
                </div>
              </div>
            )}

            {/* Lead Search History & Lists */}
            {user && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Your Data</h3>
                  <Sheet open={listsSheetOpen} onOpenChange={setListsSheetOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm">
                        <FolderOpen className="w-4 h-4 mr-1.5" />
                        Manage Lists
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Lead Lists</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <LeadListManager />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
                <LeadSearchHistory onLoadSearch={handleLoadSearch} />
              </div>
            )}

            {/* Tool Cards */}
            <ToolCards exclude="leads" />
          </div>
        </main>
      </div>
    </div>
  );
};

export default LeadFinder;
