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
      approvals: {
        Row: {
          created_at: string
          decision: string
          gate: string
          id: string
          job_id: string
          note: string | null
          target_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decision: string
          gate: string
          id?: string
          job_id: string
          note?: string | null
          target_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          decision?: string
          gate?: string
          id?: string
          job_id?: string
          note?: string | null
          target_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      commentary_drafts: {
        Row: {
          body_markdown: string
          citations: Json
          created_at: string
          id: string
          job_id: string
          status: string
          tone: string | null
          updated_at: string
          user_id: string
          validation_report_id: string | null
          workbook_id: string | null
        }
        Insert: {
          body_markdown?: string
          citations?: Json
          created_at?: string
          id?: string
          job_id: string
          status?: string
          tone?: string | null
          updated_at?: string
          user_id: string
          validation_report_id?: string | null
          workbook_id?: string | null
        }
        Update: {
          body_markdown?: string
          citations?: Json
          created_at?: string
          id?: string
          job_id?: string
          status?: string
          tone?: string | null
          updated_at?: string
          user_id?: string
          validation_report_id?: string | null
          workbook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commentary_drafts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commentary_drafts_validation_report_id_fkey"
            columns: ["validation_report_id"]
            isOneToOne: false
            referencedRelation: "validation_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commentary_drafts_workbook_id_fkey"
            columns: ["workbook_id"]
            isOneToOne: false
            referencedRelation: "workbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          id: string
          status: Database["public"]["Enums"]["job_status"]
          title: string
          type: Database["public"]["Enums"]["job_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          type: Database["public"]["Enums"]["job_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          type?: Database["public"]["Enums"]["job_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          job_id: string
          parts: Json | null
          role: Database["public"]["Enums"]["message_role"]
          step_log: Json | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          job_id: string
          parts?: Json | null
          role: Database["public"]["Enums"]["message_role"]
          step_log?: Json | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          job_id?: string
          parts?: Json | null
          role?: Database["public"]["Enums"]["message_role"]
          step_log?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      process_corrections: {
        Row: {
          applied: boolean
          corrected: Json
          created_at: string
          id: string
          note: string | null
          original: Json | null
          process_id: string
          run_id: string | null
          step_index: number
          user_id: string
        }
        Insert: {
          applied?: boolean
          corrected: Json
          created_at?: string
          id?: string
          note?: string | null
          original?: Json | null
          process_id: string
          run_id?: string | null
          step_index: number
          user_id: string
        }
        Update: {
          applied?: boolean
          corrected?: Json
          created_at?: string
          id?: string
          note?: string | null
          original?: Json | null
          process_id?: string
          run_id?: string | null
          step_index?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_corrections_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_corrections_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "process_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      process_demonstrations: {
        Row: {
          created_at: string
          duration_sec: number | null
          error: string | null
          id: string
          mime_type: string | null
          outline: Json | null
          process_id: string | null
          status: string
          storage_path: string
          transcript: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_sec?: number | null
          error?: string | null
          id?: string
          mime_type?: string | null
          outline?: Json | null
          process_id?: string | null
          status?: string
          storage_path: string
          transcript?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_sec?: number | null
          error?: string | null
          id?: string
          mime_type?: string | null
          outline?: Json | null
          process_id?: string | null
          status?: string
          storage_path?: string
          transcript?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_demonstrations_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_fixtures: {
        Row: {
          created_at: string
          description: string | null
          expected_workbook_id: string | null
          id: string
          input_workbook_id: string | null
          last_run_at: string | null
          last_run_diff: Json | null
          last_run_status: string | null
          name: string
          plan: Json
          process_id: string
          tolerance_numeric: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expected_workbook_id?: string | null
          id?: string
          input_workbook_id?: string | null
          last_run_at?: string | null
          last_run_diff?: Json | null
          last_run_status?: string | null
          name: string
          plan?: Json
          process_id: string
          tolerance_numeric?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expected_workbook_id?: string | null
          id?: string
          input_workbook_id?: string | null
          last_run_at?: string | null
          last_run_diff?: Json | null
          last_run_status?: string | null
          name?: string
          plan?: Json
          process_id?: string
          tolerance_numeric?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_fixtures_expected_workbook_id_fkey"
            columns: ["expected_workbook_id"]
            isOneToOne: false
            referencedRelation: "workbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_fixtures_input_workbook_id_fkey"
            columns: ["input_workbook_id"]
            isOneToOne: false
            referencedRelation: "workbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_fixtures_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_questions: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: string
          process_id: string
          resolved: boolean
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          kind?: string
          process_id: string
          resolved?: boolean
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: string
          process_id?: string
          resolved?: boolean
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_questions_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_runs: {
        Row: {
          context: Json
          created_at: string
          current_step: number
          error: string | null
          id: string
          process_id: string
          process_version: number
          status: string
          step_results: Json
          steps_snapshot: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          current_step?: number
          error?: string | null
          id?: string
          process_id: string
          process_version: number
          status?: string
          step_results?: Json
          steps_snapshot: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          current_step?: number
          error?: string | null
          id?: string
          process_id?: string
          process_version?: number
          status?: string
          step_results?: Json
          steps_snapshot?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_runs_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          created_at: string
          id: string
          name: string
          sop_text: string
          steps: Json
          subject: string | null
          tool: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sop_text?: string
          steps?: Json
          subject?: string | null
          tool: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sop_text?: string
          steps?: Json
          subject?: string | null
          tool?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      recipes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          steps: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          steps?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          steps?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      research_reports: {
        Row: {
          competitors: Json
          created_at: string
          id: string
          job_id: string | null
          subject_name: string
          subject_summary: string | null
          subject_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          competitors?: Json
          created_at?: string
          id?: string
          job_id?: string | null
          subject_name: string
          subject_summary?: string | null
          subject_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          competitors?: Json
          created_at?: string
          id?: string
          job_id?: string | null
          subject_name?: string
          subject_summary?: string | null
          subject_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_analyses: {
        Row: {
          context: Json
          created_at: string
          error: string | null
          id: string
          lineage: Json | null
          name: string
          narrative: string | null
          status: string
          storage_path: string
          tab_map: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          error?: string | null
          id?: string
          lineage?: Json | null
          name: string
          narrative?: string | null
          status?: string
          storage_path: string
          tab_map?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          error?: string | null
          id?: string
          lineage?: Json | null
          name?: string
          narrative?: string | null
          status?: string
          storage_path?: string
          tab_map?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sheet_analysis_questions: {
        Row: {
          analysis_id: string
          content: string
          created_at: string
          id: string
          resolved: boolean
          role: string
          topic: string | null
          user_id: string
        }
        Insert: {
          analysis_id: string
          content: string
          created_at?: string
          id?: string
          resolved?: boolean
          role: string
          topic?: string | null
          user_id: string
        }
        Update: {
          analysis_id?: string
          content?: string
          created_at?: string
          id?: string
          resolved?: boolean
          role?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheet_analysis_questions_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "sheet_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_reports: {
        Row: {
          anomalies: Json
          created_at: string
          formula_errors: Json
          id: string
          job_id: string
          lineage: Json
          message_id: string | null
          reconciliation: Json
          scorecard: Json
          status: string
          updated_at: string
          user_id: string
          workbook_id: string | null
        }
        Insert: {
          anomalies?: Json
          created_at?: string
          formula_errors?: Json
          id?: string
          job_id: string
          lineage?: Json
          message_id?: string | null
          reconciliation?: Json
          scorecard?: Json
          status?: string
          updated_at?: string
          user_id: string
          workbook_id?: string | null
        }
        Update: {
          anomalies?: Json
          created_at?: string
          formula_errors?: Json
          id?: string
          job_id?: string
          lineage?: Json
          message_id?: string | null
          reconciliation?: Json
          scorecard?: Json
          status?: string
          updated_at?: string
          user_id?: string
          workbook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "validation_reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validation_reports_workbook_id_fkey"
            columns: ["workbook_id"]
            isOneToOne: false
            referencedRelation: "workbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      workbooks: {
        Row: {
          created_at: string
          id: string
          job_id: string | null
          kind: string
          name: string
          sheet_meta: Json | null
          size_bytes: number | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id?: string | null
          kind?: string
          name: string
          sheet_meta?: Json | null
          size_bytes?: number | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string | null
          kind?: string
          name?: string
          sheet_meta?: Json | null
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workbooks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
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
      job_status: "active" | "completed" | "failed"
      job_type: "spreadsheet" | "research"
      message_role: "user" | "assistant" | "system" | "tool"
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
      job_status: ["active", "completed", "failed"],
      job_type: ["spreadsheet", "research"],
      message_role: ["user", "assistant", "system", "tool"],
    },
  },
} as const
