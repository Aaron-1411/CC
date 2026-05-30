import { supabase } from '@/integrations/supabase/client';
import { Lead } from './leads';
import type { Json } from '@/integrations/supabase/types';

export type LeadList = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  lead_count?: number;
};

export type LeadListItem = {
  id: string;
  list_id: string;
  user_id: string;
  lead_data: Lead;
  notes: string | null;
  created_at: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export const leadListsApi = {
  // Get all lists for current user
  async getLists(): Promise<ApiResponse<LeadList[]>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('lead_lists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };

    // Get counts for each list
    const listsWithCounts = await Promise.all(
      (data || []).map(async (list) => {
        const { count } = await supabase
          .from('lead_list_items')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', list.id);
        return { ...list, lead_count: count || 0 };
      })
    );

    return { success: true, data: listsWithCounts };
  },

  // Create a new list
  async createList(name: string, description?: string, color?: string): Promise<ApiResponse<LeadList>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('lead_lists')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        color: color || '#3B82F6',
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  },

  // Update a list
  async updateList(listId: string, updates: { name?: string; description?: string; color?: string }): Promise<ApiResponse<LeadList>> {
    const { data, error } = await supabase
      .from('lead_lists')
      .update(updates)
      .eq('id', listId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  },

  // Delete a list
  async deleteList(listId: string): Promise<ApiResponse<null>> {
    const { error } = await supabase
      .from('lead_lists')
      .delete()
      .eq('id', listId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  // Add a lead to a list
  async addLeadToList(listId: string, lead: Lead, notes?: string): Promise<ApiResponse<LeadListItem>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('lead_list_items')
      .insert({
        list_id: listId,
        user_id: user.id,
        lead_data: lead as unknown as Json,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: { ...data, lead_data: data.lead_data as unknown as Lead } };
  },

  // Add multiple leads to a list
  async addLeadsToList(listId: string, leads: Lead[]): Promise<ApiResponse<{ added: number }>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const items = leads.map(lead => ({
      list_id: listId,
      user_id: user.id,
      lead_data: lead as unknown as Json,
    }));

    const { error } = await supabase
      .from('lead_list_items')
      .insert(items);

    if (error) return { success: false, error: error.message };
    return { success: true, data: { added: leads.length } };
  },

  // Get leads in a list
  async getListLeads(listId: string): Promise<ApiResponse<LeadListItem[]>> {
    const { data, error } = await supabase
      .from('lead_list_items')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };
    return { 
      success: true, 
      data: (data || []).map(item => ({
        ...item,
        lead_data: item.lead_data as unknown as Lead,
      }))
    };
  },

  // Remove a lead from a list
  async removeLeadFromList(itemId: string): Promise<ApiResponse<null>> {
    const { error } = await supabase
      .from('lead_list_items')
      .delete()
      .eq('id', itemId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  // Export list leads to CSV
  exportListToCsv(leads: Lead[], listName: string): void {
    const headers = [
      'Name', 'Email', 'Phone', 'Website', 'Description', 'Category',
      'Address', 'LinkedIn', 'Quality Score'
    ];

    const rows = leads.map(lead => [
      `"${(lead.name || '').replace(/"/g, '""')}"`,
      lead.email || '',
      lead.phone || '',
      lead.website || '',
      `"${(lead.description || '').replace(/"/g, '""')}"`,
      lead.category || '',
      `"${(lead.address || '').replace(/"/g, '""')}"`,
      lead.socialProfiles?.linkedin || '',
      lead.qualityScore || '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${listName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
