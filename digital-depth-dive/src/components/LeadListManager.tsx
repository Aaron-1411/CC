import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { leadListsApi, LeadList, LeadListItem } from '@/lib/api/leadLists';
import { Lead } from '@/lib/api/leads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LeadCard } from './LeadCard';
import {
  FolderPlus, Folder, Loader2, Trash2, Download, ChevronRight,
  ArrowLeft, Users, MoreHorizontal, Edit2, Check, X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LIST_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16'
];

interface LeadListManagerProps {
  onClose?: () => void;
}

export const LeadListManager = ({ onClose }: LeadListManagerProps) => {
  const { toast } = useToast();
  const [lists, setLists] = useState<LeadList[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<LeadList | null>(null);
  const [listLeads, setListLeads] = useState<LeadListItem[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  
  // Create list state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState(LIST_COLORS[0]);
  const [creating, setCreating] = useState(false);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    setLoading(true);
    const result = await leadListsApi.getLists();
    if (result.success) {
      setLists(result.data || []);
    }
    setLoading(false);
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    setCreating(true);
    
    const result = await leadListsApi.createList(newListName.trim(), undefined, newListColor);
    if (result.success) {
      toast({ title: 'List Created', description: `"${newListName}" is ready to use` });
      setNewListName('');
      setShowCreateDialog(false);
      loadLists();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setCreating(false);
  };

  const handleDeleteList = async (listId: string, listName: string) => {
    const result = await leadListsApi.deleteList(listId);
    if (result.success) {
      toast({ title: 'Deleted', description: `"${listName}" has been removed` });
      if (selectedList?.id === listId) {
        setSelectedList(null);
        setListLeads([]);
      }
      loadLists();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleSelectList = async (list: LeadList) => {
    setSelectedList(list);
    setLoadingLeads(true);
    const result = await leadListsApi.getListLeads(list.id);
    if (result.success) {
      setListLeads(result.data || []);
    }
    setLoadingLeads(false);
  };

  const handleRemoveLead = async (itemId: string) => {
    const result = await leadListsApi.removeLeadFromList(itemId);
    if (result.success) {
      setListLeads(prev => prev.filter(item => item.id !== itemId));
      toast({ title: 'Removed', description: 'Lead removed from list' });
    }
  };

  const handleExportList = () => {
    if (!selectedList || listLeads.length === 0) return;
    const leads = listLeads.map(item => item.lead_data);
    leadListsApi.exportListToCsv(leads, selectedList.name);
    toast({ title: 'Exported', description: `${leads.length} leads exported to CSV` });
  };

  const handleSaveEdit = async (listId: string) => {
    if (!editName.trim()) return;
    const result = await leadListsApi.updateList(listId, { name: editName.trim() });
    if (result.success) {
      loadLists();
      setEditingId(null);
    }
  };

  if (selectedList) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSelectedList(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lists
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              <Users className="w-3 h-3 mr-1" />
              {listLeads.length} leads
            </Badge>
            {listLeads.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExportList}>
                <Download className="w-4 h-4 mr-1.5" />
                Export CSV
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full shrink-0" 
            style={{ backgroundColor: selectedList.color }}
          />
          <h3 className="text-xl font-semibold">{selectedList.name}</h3>
        </div>

        {loadingLeads ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : listLeads.length > 0 ? (
          <div className="grid gap-4">
            {listLeads.map((item, index) => (
              <div key={item.id} className="relative group">
                <LeadCard lead={item.lead_data} index={index} />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveLead(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No leads in this list yet</p>
            <p className="text-sm mt-1">Add leads from your search results</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Lead Lists</h3>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <FolderPlus className="w-4 h-4 mr-1.5" />
              New List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="List name (e.g., Hot Leads Q1)"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Color:</span>
                <div className="flex gap-2">
                  {LIST_COLORS.map(color => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newListColor === color ? 'scale-125 ring-2 ring-offset-2 ring-primary' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewListColor(color)}
                    />
                  ))}
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateList}
                disabled={!newListName.trim() || creating}
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create List'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : lists.length > 0 ? (
        <div className="grid gap-2">
          {lists.map(list => (
            <Card 
              key={list.id} 
              className="cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => editingId !== list.id && handleSelectList(list)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: list.color }}
                  />
                  {editingId === list.id ? (
                    <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(list.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSaveEdit(list.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium truncate">{list.name}</span>
                      <Badge variant="secondary" className="shrink-0">
                        {list.lead_count || 0} leads
                      </Badge>
                    </>
                  )}
                </div>
                {editingId !== list.id && (
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(list.id);
                          setEditName(list.name);
                        }}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteList(list.id, list.name);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No lead lists yet</p>
          <p className="text-sm mt-1">Create a list to organize your leads</p>
        </div>
      )}
    </div>
  );
};

// Component to add a single lead to a list
interface AddToListButtonProps {
  lead: Lead;
  variant?: 'default' | 'icon';
}

export const AddToListButton = ({ lead, variant = 'default' }: AddToListButtonProps) => {
  const { toast } = useToast();
  const [lists, setLists] = useState<LeadList[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const loadLists = async () => {
    setLoading(true);
    const result = await leadListsApi.getLists();
    if (result.success) {
      setLists(result.data || []);
    }
    setLoading(false);
  };

  const handleAddToList = async (listId: string, listName: string) => {
    const result = await leadListsApi.addLeadToList(listId, lead);
    if (result.success) {
      toast({ title: 'Added', description: `Lead added to "${listName}"` });
      setOpen(false);
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={(o) => { setOpen(o); if (o) loadLists(); }}>
      <DropdownMenuTrigger asChild>
        {variant === 'icon' ? (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <FolderPlus className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <FolderPlus className="w-4 h-4 mr-1.5" />
            Add to List
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {loading ? (
          <div className="p-4 flex justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        ) : lists.length > 0 ? (
          lists.map(list => (
            <DropdownMenuItem 
              key={list.id}
              onClick={() => handleAddToList(list.id, list.name)}
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
            No lists yet
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
