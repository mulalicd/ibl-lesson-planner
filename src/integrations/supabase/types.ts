// NOTE (P1, 2026-11-06; P2, 2026-11-10: nullable metadata, increment_docx_export): plans.owner_id was added by hand; the ACA could not
// regenerate these types from production. Regenerate (supabase gen types) when access exists.
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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_order: number
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_order: number
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_order?: number
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          is_complete: boolean | null
          mode: string
          plan_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_complete?: boolean | null
          mode: string
          plan_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_complete?: boolean | null
          mode?: string
          plan_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          docx_export_count: number | null
          duration_min: number | null
          gemini_key_index: number | null
          generation_time_ms: number | null
          grade: number | null
          id: string
          inquiry_question: string | null
          is_deleted: boolean | null
          is_favourite: boolean | null
          language: string
          notes: string | null
          owner_id: string | null
          plan_text: string
          prior_knowledge: string | null
          subject: string | null
          tier: string | null
          topic: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          docx_export_count?: number | null
          duration_min?: number | null
          gemini_key_index?: number | null
          generation_time_ms?: number | null
          grade?: number | null
          id?: string
          inquiry_question?: string | null
          is_deleted?: boolean | null
          is_favourite?: boolean | null
          language?: string
          notes?: string | null
          owner_id?: string | null
          plan_text: string
          prior_knowledge?: string | null
          subject?: string | null
          tier?: string | null
          topic?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          docx_export_count?: number | null
          duration_min?: number | null
          gemini_key_index?: number | null
          generation_time_ms?: number | null
          grade?: number | null
          id?: string
          inquiry_question?: string | null
          is_deleted?: boolean | null
          is_favourite?: boolean | null
          language?: string
          notes?: string | null
          owner_id?: string | null
          plan_text?: string
          prior_knowledge?: string | null
          subject?: string | null
          tier?: string | null
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      // P5-2 (2026-11-14): added by hand, supabase/owner-scripts/2026-11-14_p5-favourites-authors/02_APPLY.sql
      plan_favorites: {
        Row: { user_id: string; plan_id: string; created_at: string }
        Insert: { user_id?: string; plan_id: string; created_at?: string }
        Update: { user_id?: string; plan_id?: string; created_at?: string }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      // P2 (2026-11-10): added by hand like plans.owner_id (P1, see the note at the top).
      // Defined in supabase/owner-scripts/2026-11-06_p1-a-roles-ownership/02_APPLY.sql.
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      // P2-7, supabase/owner-scripts/2026-11-10_p2-plans-metadata/02_APPLY.sql
      increment_docx_export: { Args: { p_plan_id: string }; Returns: number }
      // P5-1b, same owner script as plan_favorites
      plan_authors: { Args: { p_plan_ids: string[] }; Returns: { plan_id: string; author: string }[] }
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
