import { supabase } from '@/integrations/supabase/client';

export type Lead = {
  name: string;
  email: string | null;
  phone: string | null;
  website: string;
  description: string;
  address?: string | null;
  category?: string;
  socialProfiles?: {
    linkedin: string | null;
    facebook: string | null;
    twitter: string | null;
  };
  businessSignals?: {
    yearsInBusiness: number | null;
    employeeCount: string | null;
    serviceAreas: string[];
  };
  decisionMaker?: {
    name: string | null;
    title: string | null;
  };
  extractionConfidence?: {
    email: 'high' | 'medium' | 'low' | 'none';
    phone: 'high' | 'medium' | 'low' | 'none';
    overall: 'high' | 'medium' | 'low';
  };
  qualityScore?: number;
};

export type LeadStats = {
  totalProcessed: number;
  leadsFound: number;
  withEmail: number;
  withPhone: number;
  averageScore?: number;
  highQuality?: number;
};

type SearchResponse = {
  success: boolean;
  error?: string;
  data?: Array<{
    url: string;
    title: string;
    description?: string;
    markdown?: string;
  }>;
};

type ExtractResponse = {
  success: boolean;
  error?: string;
  leads?: Lead[];
  stats?: LeadStats;
};

export const leadsApi = {
  async search(query: string, options?: { limit?: number; country?: string }): Promise<SearchResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-search', {
      body: { 
        query, 
        options: {
          ...options,
          scrapeOptions: {
            formats: ['markdown'],
          }
        }
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  async extractLeads(searchResults: unknown[], options?: { enrichDetails?: boolean }): Promise<ExtractResponse> {
    const { data, error } = await supabase.functions.invoke('extract-leads', {
      body: { 
        searchResults,
        enrichDetails: options?.enrichDetails ?? true,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Export leads to various formats
  exportToCsv(leads: Lead[], filename?: string): void {
    const headers = [
      'Name', 'Email', 'Phone', 'Website', 'Description', 'Category',
      'Address', 'LinkedIn', 'Facebook', 'Twitter', 'Years in Business',
      'Employee Count', 'Service Areas', 'Decision Maker', 'Title', 'Quality Score'
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
      lead.socialProfiles?.facebook || '',
      lead.socialProfiles?.twitter || '',
      lead.businessSignals?.yearsInBusiness || '',
      lead.businessSignals?.employeeCount || '',
      `"${(lead.businessSignals?.serviceAreas || []).join(', ')}"`,
      lead.decisionMaker?.name || '',
      lead.decisionMaker?.title || '',
      lead.qualityScore || '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `leads-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  exportToJson(leads: Lead[], filename?: string): void {
    const json = JSON.stringify(leads, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `leads-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Filter leads by quality
  filterByQuality(leads: Lead[], minScore: number): Lead[] {
    return leads.filter(lead => (lead.qualityScore || 0) >= minScore);
  },

  // Get leads with verified contact info only
  getVerifiedOnly(leads: Lead[]): Lead[] {
    return leads.filter(lead => lead.email || lead.phone);
  },
};
