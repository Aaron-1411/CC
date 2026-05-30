import { supabase } from '@/integrations/supabase/client';

export interface RebuilderOperation {
  id: string;
  user_id: string;
  url: string;
  original_title: string | null;
  generated_html: string;
  brand_colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  } | null;
  extracted_info: {
    businessName: string;
    industry: string;
    valueProposition: string;
  } | null;
  screenshot_url: string | null;
  created_at: string;
  updated_at: string;
}

export const rebuilderApi = {
  async save(data: {
    url: string;
    original_title: string | null;
    generated_html: string;
    brand_colors: RebuilderOperation['brand_colors'];
    extracted_info: RebuilderOperation['extracted_info'];
    screenshot_url: string | null;
  }): Promise<{ success: boolean; data?: RebuilderOperation; error?: string }> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: result, error } = await supabase
      .from('rebuilder_operations')
      .insert({
        user_id: userData.user.id,
        url: data.url,
        original_title: data.original_title,
        generated_html: data.generated_html,
        brand_colors: data.brand_colors,
        extracted_info: data.extracted_info,
        screenshot_url: data.screenshot_url,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: result as RebuilderOperation };
  },

  async list(): Promise<{ success: boolean; data?: RebuilderOperation[]; error?: string }> {
    const { data, error } = await supabase
      .from('rebuilder_operations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as RebuilderOperation[] };
  },

  async getById(id: string): Promise<{ success: boolean; data?: RebuilderOperation; error?: string }> {
    const { data, error } = await supabase
      .from('rebuilder_operations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as RebuilderOperation };
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('rebuilder_operations')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },
};
