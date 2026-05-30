import { supabase } from '@/integrations/supabase/client';
import { Lead, LeadStats } from './leads';

export interface SavedLeadSearch {
  id: string;
  user_id: string;
  search_query: string;
  search_type: string;
  location: string | null;
  leads_found: number;
  leads_data: Lead[];
  filters_applied: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export const leadSearchesApi = {
  async save(params: {
    searchQuery: string;
    searchType?: string;
    location?: string;
    leads: Lead[];
    filtersApplied?: Record<string, any>;
  }): Promise<{ success: boolean; data?: SavedLeadSearch; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('lead_searches')
      .insert({
        user_id: user.id,
        search_query: params.searchQuery,
        search_type: params.searchType || 'industry',
        location: params.location || null,
        leads_found: params.leads.length,
        leads_data: params.leads as any,
        filters_applied: params.filtersApplied || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving lead search:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: {
        ...data,
        leads_data: data.leads_data as Lead[],
        filters_applied: data.filters_applied as Record<string, any> | null,
      } 
    };
  },

  async list(): Promise<{ success: boolean; data?: SavedLeadSearch[]; error?: string }> {
    const { data, error } = await supabase
      .from('lead_searches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing lead searches:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: (data || []).map(item => ({
        ...item,
        leads_data: item.leads_data as Lead[],
        filters_applied: item.filters_applied as Record<string, any> | null,
      }))
    };
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('lead_searches')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting lead search:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  async get(id: string): Promise<{ success: boolean; data?: SavedLeadSearch; error?: string }> {
    const { data, error } = await supabase
      .from('lead_searches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting lead search:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: {
        ...data,
        leads_data: data.leads_data as Lead[],
        filters_applied: data.filters_applied as Record<string, any> | null,
      }
    };
  },
};
