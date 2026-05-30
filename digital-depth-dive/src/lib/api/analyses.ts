import { supabase } from '@/integrations/supabase/client';
import { AnalysisResult } from './analyze';
import { Json } from '@/integrations/supabase/types';

export interface SavedAnalysis {
  id: string;
  user_id: string;
  url: string;
  analyzed_url: string;
  screenshot_url: string | null;
  analysis_data: AnalysisResult;
  metadata: {
    title?: string;
    description?: string;
    sourceURL?: string;
  } | null;
  is_public: boolean;
  share_token: string;
  pages_analyzed: number;
  created_at: string;
  updated_at: string;
}

export const analysesApi = {
  async save(params: {
    url: string;
    analyzedUrl: string;
    screenshotUrl?: string;
    analysisData: AnalysisResult;
    metadata?: { title?: string; description?: string; sourceURL?: string };
    pagesAnalyzed?: number;
  }): Promise<{ success: boolean; data?: SavedAnalysis; error?: string }> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('analyses')
      .insert({
        user_id: userData.user.id,
        url: params.url,
        analyzed_url: params.analyzedUrl,
        screenshot_url: params.screenshotUrl || null,
        analysis_data: params.analysisData as unknown as Json,
        metadata: params.metadata as unknown as Json || null,
        pages_analyzed: params.pagesAnalyzed || 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving analysis:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: {
        ...data,
        analysis_data: data.analysis_data as unknown as AnalysisResult,
        metadata: data.metadata as SavedAnalysis['metadata'],
      } 
    };
  },

  async list(): Promise<{ success: boolean; data?: SavedAnalysis[]; error?: string }> {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching analyses:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: data.map(item => ({
        ...item,
        analysis_data: item.analysis_data as unknown as AnalysisResult,
        metadata: item.metadata as SavedAnalysis['metadata'],
      }))
    };
  },

  async getById(id: string): Promise<{ success: boolean; data?: SavedAnalysis; error?: string }> {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching analysis:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Analysis not found' };
    }

    return { 
      success: true, 
      data: {
        ...data,
        analysis_data: data.analysis_data as unknown as AnalysisResult,
        metadata: data.metadata as SavedAnalysis['metadata'],
      }
    };
  },

  async getByShareToken(shareToken: string): Promise<{ success: boolean; data?: SavedAnalysis; error?: string }> {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('share_token', shareToken)
      .eq('is_public', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching shared analysis:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Shared analysis not found' };
    }

    return { 
      success: true, 
      data: {
        ...data,
        analysis_data: data.analysis_data as unknown as AnalysisResult,
        metadata: data.metadata as SavedAnalysis['metadata'],
      }
    };
  },

  async togglePublic(id: string, isPublic: boolean): Promise<{ success: boolean; shareToken?: string; error?: string }> {
    const { data, error } = await supabase
      .from('analyses')
      .update({ is_public: isPublic })
      .eq('id', id)
      .select('share_token')
      .single();

    if (error) {
      console.error('Error toggling public:', error);
      return { success: false, error: error.message };
    }

    return { success: true, shareToken: data.share_token };
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting analysis:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },
};
