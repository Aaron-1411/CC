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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          created_at: string
          id: string
          ip: string | null
          metadata: Json
          target_id: string | null
          target_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      boe_rate_cache: {
        Row: {
          data: Json
          fetched_at: string
          id: string
        }
        Insert: {
          data: Json
          fetched_at?: string
          id?: string
        }
        Update: {
          data?: Json
          fetched_at?: string
          id?: string
        }
        Relationships: []
      }
      broker_invites: {
        Row: {
          accepted_at: string | null
          broker_email: string | null
          broker_name: string | null
          code: string
          created_at: string
          id: string
          message: string | null
          receipt_id: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          broker_email?: string | null
          broker_name?: string | null
          code: string
          created_at?: string
          id?: string
          message?: string | null
          receipt_id?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          broker_email?: string | null
          broker_name?: string | null
          code?: string
          created_at?: string
          id?: string
          message?: string | null
          receipt_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_invites_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "verdict_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      calculator_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          inputs: Json
          source: string
          total_upfront: number | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          inputs?: Json
          source?: string
          total_upfront?: number | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          inputs?: Json
          source?: string
          total_upfront?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      comparables_cache: {
        Row: {
          data: Json
          fetched_at: string
          postcode_area: string
        }
        Insert: {
          data: Json
          fetched_at?: string
          postcode_area: string
        }
        Update: {
          data?: Json
          fetched_at?: string
          postcode_area?: string
        }
        Relationships: []
      }
      crime_cache: {
        Row: {
          data: Json
          fetched_at: string
          geo_key: string
        }
        Insert: {
          data: Json
          fetched_at?: string
          geo_key: string
        }
        Update: {
          data?: Json
          fetched_at?: string
          geo_key?: string
        }
        Relationships: []
      }
      epc_cache: {
        Row: {
          data: Json
          fetched_at: string
          postcode: string
        }
        Insert: {
          data: Json
          fetched_at?: string
          postcode: string
        }
        Update: {
          data?: Json
          fetched_at?: string
          postcode?: string
        }
        Relationships: []
      }
      hpi_cache: {
        Row: {
          data: Json
          fetched_at: string
          lad_code: string
          lad_name: string | null
        }
        Insert: {
          data: Json
          fetched_at?: string
          lad_code: string
          lad_name?: string | null
        }
        Update: {
          data?: Json
          fetched_at?: string
          lad_code?: string
          lad_name?: string | null
        }
        Relationships: []
      }
      mip_assessments: {
        Row: {
          created_at: string
          id: string
          inputs: Json
          result: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inputs: Json
          result: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inputs?: Json
          result?: Json
          user_id?: string
        }
        Relationships: []
      }
      outcomes: {
        Row: {
          actual_price: number | null
          completed_at: string | null
          created_at: string
          id: string
          months_after_completion: number | null
          predicted_price: number | null
          predicted_score: number | null
          property_ref: string | null
          regret_notes: string | null
          satisfaction: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_price?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          months_after_completion?: number | null
          predicted_price?: number | null
          predicted_score?: number | null
          property_ref?: string | null
          regret_notes?: string | null
          satisfaction?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_price?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          months_after_completion?: number | null
          predicted_price?: number | null
          predicted_score?: number | null
          property_ref?: string | null
          regret_notes?: string | null
          satisfaction?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      postcode_cache: {
        Row: {
          data: Json
          fetched_at: string
          postcode: string
        }
        Insert: {
          data: Json
          fetched_at?: string
          postcode: string
        }
        Update: {
          data?: Json
          fetched_at?: string
          postcode?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          last_checked_at: string | null
          last_value: number | null
          postcode: string | null
          property_url: string | null
          threshold_pct: number
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label: string
          last_checked_at?: string | null
          last_value?: number | null
          postcode?: string | null
          property_url?: string | null
          threshold_pct?: number
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          last_checked_at?: string | null
          last_value?: number | null
          postcode?: string | null
          property_url?: string | null
          threshold_pct?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rental_cache: {
        Row: {
          data: Json
          fetched_at: string
          region: string
        }
        Insert: {
          data: Json
          fetched_at?: string
          region: string
        }
        Update: {
          data?: Json
          fetched_at?: string
          region?: string
        }
        Relationships: []
      }
      saved_properties: {
        Row: {
          address: string
          area: string | null
          baths: number | null
          beds: number | null
          created_at: string
          id: string
          image_url: string | null
          notes: string | null
          price: number | null
          source: string
          sqft: number | null
          tags: string[]
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          address: string
          area?: string | null
          baths?: number | null
          beds?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          notes?: string | null
          price?: number | null
          source?: string
          sqft?: number | null
          tags?: string[]
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          address?: string
          area?: string | null
          baths?: number | null
          beds?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          notes?: string | null
          price?: number | null
          source?: string
          sqft?: number | null
          tags?: string[]
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_scenarios: {
        Row: {
          created_at: string
          data: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scenario_collaborators: {
        Row: {
          accepted_at: string | null
          collaborator_user_id: string | null
          created_at: string
          id: string
          invited_email: string
          owner_id: string
          role: string
          scenario_id: string
        }
        Insert: {
          accepted_at?: string | null
          collaborator_user_id?: string | null
          created_at?: string
          id?: string
          invited_email: string
          owner_id: string
          role?: string
          scenario_id: string
        }
        Update: {
          accepted_at?: string | null
          collaborator_user_id?: string | null
          created_at?: string
          id?: string
          invited_email?: string
          owner_id?: string
          role?: string
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_collaborators_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "saved_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_cache: {
        Row: {
          data: Json
          fetched_at: string
          geo_key: string
        }
        Insert: {
          data: Json
          fetched_at?: string
          geo_key: string
        }
        Update: {
          data?: Json
          fetched_at?: string
          geo_key?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verdict_receipts: {
        Row: {
          band: string | null
          created_at: string
          id: string
          property_ref: string | null
          score: number | null
          signature: string
          slug: string
          user_id: string
          verdict: Json
        }
        Insert: {
          band?: string | null
          created_at?: string
          id?: string
          property_ref?: string | null
          score?: number | null
          signature: string
          slug: string
          user_id: string
          verdict?: Json
        }
        Update: {
          band?: string | null
          created_at?: string
          id?: string
          property_ref?: string | null
          score?: number | null
          signature?: string
          slug?: string
          user_id?: string
          verdict?: Json
        }
        Relationships: []
      }
      verdict_snapshots: {
        Row: {
          created_at: string
          id: string
          inputs: Json | null
          label: string | null
          property_key: string
          reasons: Json | null
          score: number
          user_id: string
          verdict: string
        }
        Insert: {
          created_at?: string
          id?: string
          inputs?: Json | null
          label?: string | null
          property_key: string
          reasons?: Json | null
          score: number
          user_id: string
          verdict: string
        }
        Update: {
          created_at?: string
          id?: string
          inputs?: Json | null
          label?: string | null
          property_key?: string
          reasons?: Json | null
          score?: number
          user_id?: string
          verdict?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_broker_invite: { Args: { p_code: string }; Returns: boolean }
      admin_audit_search: {
        Args: {
          p_action?: string
          p_from?: string
          p_limit?: number
          p_offset?: number
          p_q?: string
          p_to?: string
        }
        Returns: {
          action: string
          actor_email: string
          created_at: string
          id: string
          metadata: Json
          target_id: string
          target_type: string
          total_count: number
          user_id: string
        }[]
      }
      admin_daily_activity: {
        Args: { p_days?: number }
        Returns: {
          day: string
          events: number
          unique_users: number
        }[]
      }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          last_sign_in_at: string
          mip_assessments_count: number
          price_alerts_count: number
          role: Database["public"]["Enums"]["app_role"]
          saved_properties_count: number
          saved_scenarios_count: number
          user_id: string
        }[]
      }
      admin_recent_audit: {
        Args: { p_limit?: number }
        Returns: {
          action: string
          actor_email: string | null
          created_at: string
          id: string
          ip: string | null
          metadata: Json
          target_id: string | null
          target_type: string | null
          user_agent: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "audit_log"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_set_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: boolean
      }
      admin_usage_stats: {
        Args: { p_days?: number }
        Returns: {
          avg_duration_ms: number
          events: number
          last_used: string
          p95_duration_ms: number
          tool: string
          unique_users: number
        }[]
      }
      bootstrap_admin: { Args: { p_password: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_action: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_target_id?: string
          p_target_type?: string
        }
        Returns: string
      }
      lookup_broker_invite: {
        Args: { p_code: string }
        Returns: {
          accepted_at: string
          broker_name: string
          created_at: string
          id: string
          message: string
          receipt_id: string
        }[]
      }
      public_outcome_accuracy: {
        Args: never
        Returns: {
          avg_price_error_pct: number
          avg_satisfaction: number
          sample_size: number
          within_10pct: number
          within_5pct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "pro" | "free"
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
    Enums: {
      app_role: ["admin", "pro", "free"],
    },
  },
} as const
