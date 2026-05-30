import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { leadSearchesApi, SavedLeadSearch } from '@/lib/api/leadSearches';
import { leadsApi } from '@/lib/api/leads';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  Trash2, 
  Download, 
  FileJson, 
  Users, 
  Mail, 
  Phone,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface LeadSearchHistoryProps {
  onLoadSearch?: (search: SavedLeadSearch) => void;
}

export const LeadSearchHistory = ({ onLoadSearch }: LeadSearchHistoryProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searches, setSearches] = useState<SavedLeadSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSearches();
    }
  }, [user]);

  const loadSearches = async () => {
    setLoading(true);
    const result = await leadSearchesApi.list();
    if (result.success && result.data) {
      setSearches(result.data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const result = await leadSearchesApi.delete(id);
    if (result.success) {
      setSearches(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Search deleted' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setDeletingId(null);
  };

  const exportCsv = (search: SavedLeadSearch) => {
    leadsApi.exportToCsv(search.leads_data, `leads-${search.search_query.replace(/\s+/g, '-')}.csv`);
    toast({ title: 'Exported!', description: 'Leads exported to CSV file' });
  };

  const exportJson = (search: SavedLeadSearch) => {
    leadsApi.exportToJson(search.leads_data, `leads-${search.search_query.replace(/\s+/g, '-')}.json`);
    toast({ title: 'Exported!', description: 'Leads exported to JSON file' });
  };

  if (!user) return null;
  if (searches.length === 0 && !loading) return null;

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-primary" />
          <span className="font-medium">Search History</span>
          <Badge variant="secondary" className="text-xs">{searches.length}</Badge>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="border-t border-border/50">
          {loading ? (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {searches.map((search) => (
                <div 
                  key={search.id}
                  className="p-4 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => onLoadSearch?.(search)}
                    >
                      <p className="font-medium text-sm">{search.search_query}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {search.leads_found} leads
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(search.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => exportCsv(search)}
                        title="Export CSV"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => exportJson(search)}
                        title="Export JSON"
                      >
                        <FileJson className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(search.id)}
                        disabled={deletingId === search.id}
                        title="Delete"
                      >
                        {deletingId === search.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
