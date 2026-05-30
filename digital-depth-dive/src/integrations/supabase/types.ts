export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          analysis_data: Json
          analyzed_url: string
          created_at: string
          id: string
          is_public: boolean
          metadata: Json | null
          pages_analyzed: number
          screenshot_url: string | null
          share_token: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          analysis_data: Json
          analyzed_url: string
          created_at?: string
          id?: string
          is_public?: boolean
          metadata?: Json | null
          pages_analyzed?: number
          screenshot_url?: string | null
          share_token?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          analysis_data?: Json
          analyzed_url?: string
          created_at?: string
          id?: string
          is_public?: boolean
          metadata?: Json | null
          pages_analyzed?: number
          screenshot_url?: string | null
          share_token?: string | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      email_sequences: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_ads: {
        Row: {
          brand_analysis: Json | null
          call_to_action: string | null
          created_at: string
          format: string | null
          headline: string
          hook: string | null
          id: string
          image_prompt: string | null
          marketing_angle: string | null
          platform: string
          primary_text: string
          source_url: string
          target_persona: string | null
          user_id: string
        }
        Insert: {
          brand_analysis?: Json | null
          call_to_action?: string | null
          created_at?: string
          format?: string | null
          headline: string
          hook?: string | null
          id?: string
          image_prompt?: string | null
          marketing_angle?: string | null
          platform: string
          primary_text: string
          source_url: string
          target_persona?: string | null
          user_id: string
        }
        Update: {
          brand_analysis?: Json | null
          call_to_action?: string | null
          created_at?: string
          format?: string | null
          headline?: string
          hook?: string | null
          id?: string
          image_prompt?: string | null
          marketing_angle?: string | null
          platform?: string
          primary_text?: string
          source_url?: string
          target_persona?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lead_list_items: {
        Row: {
          created_at: string
          id: string
          lead_data: Json
          list_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_data: Json
          list_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_data?: Json
          list_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lead_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_lists: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_searches: {
        Row: {
          created_at: string
          filters_applied: Json | null
          id: string
          leads_data: Json
          leads_found: number
          location: string | null
          search_query: string
          search_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters_applied?: Json | null
          id?: string
          leads_data?: Json
          leads_found?: number
          location?: string | null
          search_query: string
          search_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters_applied?: Json | null
          id?: string
          leads_data?: Json
          leads_found?: number
          location?: string | null
          search_query?: string
          search_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rebuilder_operations: {
        Row: {
          brand_colors: Json | null
          created_at: string
          extracted_info: Json | null
          generated_html: string
          id: string
          original_title: string | null
          screenshot_url: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          brand_colors?: Json | null
          created_at?: string
          extracted_info?: Json | null
          generated_html: string
          id?: string
          original_title?: string | null
          screenshot_url?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          brand_colors?: Json | null
          created_at?: string
          extracted_info?: Json | null
          generated_html?: string
          id?: string
          original_title?: string | null
          screenshot_url?: string | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_ads: {
        Row: {
          ad_copy: string
          ad_title: string
          advertiser: string
          created_at: string
          id: string
          landing_page: string | null
          media_url: string | null
          metrics: Json | null
          platform: string
          source_url: string | null
          user_id: string
        }
        Insert: {
          ad_copy: string
          ad_title: string
          advertiser: string
          created_at?: string
          id?: string
          landing_page?: string | null
          media_url?: string | null
          metrics?: Json | null
          platform: string
          source_url?: string | null
          user_id: string
        }
        Update: {
          ad_copy?: string
          ad_title?: string
          advertiser?: string
          created_at?: string
          id?: string
          landing_page?: string | null
          media_url?: string | null
          metrics?: Json | null
          platform?: string
          source_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          content: string
          created_at: string
          error_message: string | null
          id: string
          media_url: string | null
          platform: string
          post_id: string | null
          scheduled_for: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          error_message?: string | null
          id?: string
          media_url?: string | null
          platform: string
          post_id?: string | null
          scheduled_for: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          error_message?: string | null
          id?: string
          media_url?: string | null
          platform?: string
          post_id?: string | null
          scheduled_for?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sequence_emails: {
        Row: {
          body: string
          created_at: string
          delay_days: number
          id: string
          order_index: number
          sequence_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          delay_days?: number
          id?: string
          order_index?: number
          sequence_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          delay_days?: number
          id?: string
          order_index?: number
          sequence_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequence_emails_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      sequence_leads: {
        Row: {
          created_at: string
          current_email_index: number
          id: string
          last_sent_at: string | null
          lead_company: string | null
          lead_email: string
          lead_name: string | null
          lead_source: string | null
          sequence_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_email_index?: number
          id?: string
          last_sent_at?: string | null
          lead_company?: string | null
          lead_email: string
          lead_name?: string | null
          lead_source?: string | null
          sequence_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_email_index?: number
          id?: string
          last_sent_at?: string | null
          lead_company?: string | null
          lead_email?: string
          lead_name?: string | null
          lead_source?: string | null
          sequence_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequence_leads_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
