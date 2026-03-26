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
      credit_settings: {
        Row: {
          created_at: string
          credit_value_usd: number
          default_credits_per_generation: number
          id: string
          min_credits_per_action: number
          rounding_rule: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_value_usd?: number
          default_credits_per_generation?: number
          id?: string
          min_credits_per_action?: number
          rounding_rule?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_value_usd?: number
          default_credits_per_generation?: number
          id?: string
          min_credits_per_action?: number
          rounding_rule?: string
          updated_at?: string
        }
        Relationships: []
      }
      generation_logs: {
        Row: {
          created_at: string
          credits_used: number
          id: string
          image_url: string | null
          margin: number
          model_id: string | null
          prompt: string | null
          provider_cost: number
          provider_id: string | null
          ratio: string | null
          resolution: string | null
          revenue: number
          tool_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          credits_used?: number
          id?: string
          image_url?: string | null
          margin?: number
          model_id?: string | null
          prompt?: string | null
          provider_cost?: number
          provider_id?: string | null
          ratio?: string | null
          resolution?: string | null
          revenue?: number
          tool_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          credits_used?: number
          id?: string
          image_url?: string | null
          margin?: number
          model_id?: string | null
          prompt?: string | null
          provider_cost?: number
          provider_id?: string | null
          ratio?: string | null
          resolution?: string | null
          revenue?: number
          tool_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_logs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          admin_overrides: Json
          best_for: string | null
          cost_per_run: number | null
          created_at: string
          credits_per_generation: number | null
          default_ratio: string | null
          default_resolution: string | null
          endpoint_id: string
          id: string
          input_type: string
          is_active: boolean
          is_default: boolean
          last_sync_at: string | null
          max_resolution: string | null
          model_name: string
          notes: string | null
          provider_id: string | null
          provider_name: string
          speed: string | null
          supported_ratios: Json
          supported_sizes: Json
          updated_at: string
        }
        Insert: {
          admin_overrides?: Json
          best_for?: string | null
          cost_per_run?: number | null
          created_at?: string
          credits_per_generation?: number | null
          default_ratio?: string | null
          default_resolution?: string | null
          endpoint_id: string
          id?: string
          input_type?: string
          is_active?: boolean
          is_default?: boolean
          last_sync_at?: string | null
          max_resolution?: string | null
          model_name: string
          notes?: string | null
          provider_id?: string | null
          provider_name?: string
          speed?: string | null
          supported_ratios?: Json
          supported_sizes?: Json
          updated_at?: string
        }
        Update: {
          admin_overrides?: Json
          best_for?: string | null
          cost_per_run?: number | null
          created_at?: string
          credits_per_generation?: number | null
          default_ratio?: string | null
          default_resolution?: string | null
          endpoint_id?: string
          id?: string
          input_type?: string
          is_active?: boolean
          is_default?: boolean
          last_sync_at?: string | null
          max_resolution?: string | null
          model_name?: string
          notes?: string | null
          provider_id?: string | null
          provider_name?: string
          speed?: string | null
          supported_ratios?: Json
          supported_sizes?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "models_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_configs: {
        Row: {
          api_key_set: boolean
          base_cost: number | null
          billing_notes: string | null
          config: Json
          created_at: string
          currency: string | null
          default_model: string | null
          environment: string
          fallback_cost: number | null
          health_status: string
          id: string
          is_connected: boolean
          last_sync_at: string | null
          pricing_type: string | null
          provider_name: string
          provider_type: string
          updated_at: string
        }
        Insert: {
          api_key_set?: boolean
          base_cost?: number | null
          billing_notes?: string | null
          config?: Json
          created_at?: string
          currency?: string | null
          default_model?: string | null
          environment?: string
          fallback_cost?: number | null
          health_status?: string
          id?: string
          is_connected?: boolean
          last_sync_at?: string | null
          pricing_type?: string | null
          provider_name: string
          provider_type?: string
          updated_at?: string
        }
        Update: {
          api_key_set?: boolean
          base_cost?: number | null
          billing_notes?: string | null
          config?: Json
          created_at?: string
          currency?: string | null
          default_model?: string | null
          environment?: string
          fallback_cost?: number | null
          health_status?: string
          id?: string
          is_connected?: boolean
          last_sync_at?: string | null
          pricing_type?: string | null
          provider_name?: string
          provider_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      tools_pricing: {
        Row: {
          created_at: string
          credit_multiplier: number
          credits_per_generation: number
          default_model_id: string | null
          free_usage_enabled: boolean
          id: string
          max_free_uses: number | null
          override_model_pricing: boolean
          tool_id: string
          tool_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_multiplier?: number
          credits_per_generation?: number
          default_model_id?: string | null
          free_usage_enabled?: boolean
          id?: string
          max_free_uses?: number | null
          override_model_pricing?: boolean
          tool_id: string
          tool_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_multiplier?: number
          credits_per_generation?: number
          default_model_id?: string | null
          free_usage_enabled?: boolean
          id?: string
          max_free_uses?: number | null
          override_model_pricing?: boolean
          tool_id?: string
          tool_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tools_pricing_default_model_id_fkey"
            columns: ["default_model_id"]
            isOneToOne: false
            referencedRelation: "models"
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
