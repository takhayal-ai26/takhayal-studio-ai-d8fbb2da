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
      credit_packages: {
        Row: {
          active: boolean
          badge_ar: string
          badge_en: string
          created_at: string
          credits: number
          cta_label_ar: string
          cta_label_en: string
          currency: string
          description_ar: string
          description_en: string
          featured: boolean
          id: string
          name_ar: string
          name_en: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          badge_ar?: string
          badge_en?: string
          created_at?: string
          credits?: number
          cta_label_ar?: string
          cta_label_en?: string
          currency?: string
          description_ar?: string
          description_en?: string
          featured?: boolean
          id?: string
          name_ar?: string
          name_en: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          badge_ar?: string
          badge_en?: string
          created_at?: string
          credits?: number
          cta_label_ar?: string
          cta_label_en?: string
          currency?: string
          description_ar?: string
          description_en?: string
          featured?: boolean
          id?: string
          name_ar?: string
          name_en?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
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
      credit_usage_explanations: {
        Row: {
          active: boolean
          created_at: string
          icon: string
          id: string
          sort_order: number
          subtitle_ar: string
          subtitle_en: string
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string
          id?: string
          sort_order?: number
          subtitle_ar?: string
          subtitle_en?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string
          id?: string
          sort_order?: number
          subtitle_ar?: string
          subtitle_en?: string
          title_ar?: string
          title_en?: string
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
          quality_tier: string | null
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
          quality_tier?: string | null
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
          quality_tier?: string | null
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
      model_pricing_tiers: {
        Row: {
          aspect_ratio: string | null
          cost_per_run: number
          created_at: string
          credits_charged: number
          height: number | null
          id: string
          is_default: boolean
          megapixels: number | null
          model_id: string
          notes: string | null
          pricing_mode: string
          quality_level: string | null
          resolution_key: string | null
          tier_label: string
          updated_at: string
          width: number | null
        }
        Insert: {
          aspect_ratio?: string | null
          cost_per_run?: number
          created_at?: string
          credits_charged?: number
          height?: number | null
          id?: string
          is_default?: boolean
          megapixels?: number | null
          model_id: string
          notes?: string | null
          pricing_mode?: string
          quality_level?: string | null
          resolution_key?: string | null
          tier_label?: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          aspect_ratio?: string | null
          cost_per_run?: number
          created_at?: string
          credits_charged?: number
          height?: number | null
          id?: string
          is_default?: boolean
          megapixels?: number | null
          model_id?: string
          notes?: string | null
          pricing_mode?: string
          quality_level?: string | null
          resolution_key?: string | null
          tier_label?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "model_pricing_tiers_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
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
          pricing_mode: string
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
          pricing_mode?: string
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
          pricing_mode?: string
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
      pricing_faqs: {
        Row: {
          active: boolean
          answer_ar: string
          answer_en: string
          created_at: string
          id: string
          question_ar: string
          question_en: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer_ar?: string
          answer_en?: string
          created_at?: string
          id?: string
          question_ar?: string
          question_en?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer_ar?: string
          answer_en?: string
          created_at?: string
          id?: string
          question_ar?: string
          question_en?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      pricing_page_content: {
        Row: {
          active: boolean
          field_key: string
          id: string
          metadata_json: Json
          section_key: string
          sort_order: number
          updated_at: string
          value_ar: string
          value_en: string
        }
        Insert: {
          active?: boolean
          field_key: string
          id?: string
          metadata_json?: Json
          section_key: string
          sort_order?: number
          updated_at?: string
          value_ar?: string
          value_en?: string
        }
        Update: {
          active?: boolean
          field_key?: string
          id?: string
          metadata_json?: Json
          section_key?: string
          sort_order?: number
          updated_at?: string
          value_ar?: string
          value_en?: string
        }
        Relationships: []
      }
      pricing_plan_features: {
        Row: {
          active: boolean
          id: string
          plan_id: string
          sort_order: number
          text_ar: string
          text_en: string
        }
        Insert: {
          active?: boolean
          id?: string
          plan_id: string
          sort_order?: number
          text_ar?: string
          text_en?: string
        }
        Update: {
          active?: boolean
          id?: string
          plan_id?: string
          sort_order?: number
          text_ar?: string
          text_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          active: boolean
          badge_ar: string
          badge_en: string
          billing_period: string
          created_at: string
          cta_action: string
          cta_label_ar: string
          cta_label_en: string
          currency: string
          description_ar: string
          description_en: string
          featured: boolean
          id: string
          included_credits: number
          is_default: boolean
          name_ar: string
          name_en: string
          price: number
          slug: string
          sort_order: number
          updated_at: string
          visible_logged_in: boolean
          visible_logged_out: boolean
        }
        Insert: {
          active?: boolean
          badge_ar?: string
          badge_en?: string
          billing_period?: string
          created_at?: string
          cta_action?: string
          cta_label_ar?: string
          cta_label_en?: string
          currency?: string
          description_ar?: string
          description_en?: string
          featured?: boolean
          id?: string
          included_credits?: number
          is_default?: boolean
          name_ar?: string
          name_en: string
          price?: number
          slug: string
          sort_order?: number
          updated_at?: string
          visible_logged_in?: boolean
          visible_logged_out?: boolean
        }
        Update: {
          active?: boolean
          badge_ar?: string
          badge_en?: string
          billing_period?: string
          created_at?: string
          cta_action?: string
          cta_label_ar?: string
          cta_label_en?: string
          currency?: string
          description_ar?: string
          description_en?: string
          featured?: boolean
          id?: string
          included_credits?: number
          is_default?: boolean
          name_ar?: string
          name_en?: string
          price?: number
          slug?: string
          sort_order?: number
          updated_at?: string
          visible_logged_in?: boolean
          visible_logged_out?: boolean
        }
        Relationships: []
      }
      pricing_sync_logs: {
        Row: {
          created_at: string
          details: Json
          error_message: string | null
          id: string
          provider_id: string | null
          provider_name: string
          sync_status: string
          synced_models_count: number
        }
        Insert: {
          created_at?: string
          details?: Json
          error_message?: string | null
          id?: string
          provider_id?: string | null
          provider_name: string
          sync_status?: string
          synced_models_count?: number
        }
        Update: {
          created_at?: string
          details?: Json
          error_message?: string | null
          id?: string
          provider_id?: string | null
          provider_name?: string
          sync_status?: string
          synced_models_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "pricing_sync_logs_provider_id_fkey"
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
