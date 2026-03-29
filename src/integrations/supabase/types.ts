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
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: []
      }
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
          actual_api_cost: number
          actual_output_height: number | null
          actual_output_width: number | null
          created_at: string
          credits_used: number
          generation_cost: number
          id: string
          image_url: string | null
          margin: number
          margin_pct: number
          model_id: string | null
          profit_usd: number
          prompt: string | null
          provider_cost: number
          provider_id: string | null
          quality_tier: string | null
          ratio: string | null
          requested_quality_tier: string | null
          requested_ratio: string | null
          resolution: string | null
          revenue: number
          revenue_usd: number
          tool_id: string | null
          upscale_cost: number
          upscale_model: string | null
          used_upscale_pipeline: boolean
          user_id: string | null
          was_upscaled: boolean
        }
        Insert: {
          actual_api_cost?: number
          actual_output_height?: number | null
          actual_output_width?: number | null
          created_at?: string
          credits_used?: number
          generation_cost?: number
          id?: string
          image_url?: string | null
          margin?: number
          margin_pct?: number
          model_id?: string | null
          profit_usd?: number
          prompt?: string | null
          provider_cost?: number
          provider_id?: string | null
          quality_tier?: string | null
          ratio?: string | null
          requested_quality_tier?: string | null
          requested_ratio?: string | null
          resolution?: string | null
          revenue?: number
          revenue_usd?: number
          tool_id?: string | null
          upscale_cost?: number
          upscale_model?: string | null
          used_upscale_pipeline?: boolean
          user_id?: string | null
          was_upscaled?: boolean
        }
        Update: {
          actual_api_cost?: number
          actual_output_height?: number | null
          actual_output_width?: number | null
          created_at?: string
          credits_used?: number
          generation_cost?: number
          id?: string
          image_url?: string | null
          margin?: number
          margin_pct?: number
          model_id?: string | null
          profit_usd?: number
          prompt?: string | null
          provider_cost?: number
          provider_id?: string | null
          quality_tier?: string | null
          ratio?: string | null
          requested_quality_tier?: string | null
          requested_ratio?: string | null
          resolution?: string | null
          revenue?: number
          revenue_usd?: number
          tool_id?: string | null
          upscale_cost?: number
          upscale_model?: string | null
          used_upscale_pipeline?: boolean
          user_id?: string | null
          was_upscaled?: boolean
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
      legal_policies: {
        Row: {
          content_ar: string
          content_en: string
          id: string
          last_updated: string
          type: string
        }
        Insert: {
          content_ar?: string
          content_en?: string
          id?: string
          last_updated?: string
          type: string
        }
        Update: {
          content_ar?: string
          content_en?: string
          id?: string
          last_updated?: string
          type?: string
        }
        Relationships: []
      }
      model_pricing_tiers: {
        Row: {
          aspect_ratio: string | null
          cost_per_run: number
          created_at: string
          credits_charged: number
          height: number | null
          id: string
          is_active: boolean
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
          is_active?: boolean
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
          is_active?: boolean
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
          best_for_ar: string | null
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
          supported_quality_tiers: Json
          supported_ratios: Json
          supported_sizes: Json
          supports_native_high_res: boolean
          updated_at: string
          upscale_strategy: string
        }
        Insert: {
          admin_overrides?: Json
          best_for?: string | null
          best_for_ar?: string | null
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
          supported_quality_tiers?: Json
          supported_ratios?: Json
          supported_sizes?: Json
          supports_native_high_res?: boolean
          updated_at?: string
          upscale_strategy?: string
        }
        Update: {
          admin_overrides?: Json
          best_for?: string | null
          best_for_ar?: string | null
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
          supported_quality_tiers?: Json
          supported_ratios?: Json
          supported_sizes?: Json
          supports_native_high_res?: boolean
          updated_at?: string
          upscale_strategy?: string
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
      platform_config: {
        Row: {
          config_key: string
          config_value: string
          id: string
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value?: string
          id?: string
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
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
      template_categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name_ar: string
          name_en: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name_ar?: string
          name_en: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          active: boolean
          category: string
          cover_image_url: string
          created_at: string
          featured: boolean
          id: string
          prompt: string
          ratio: string
          show_on_studio: boolean
          sort_order: number
          studio_sort_order: number
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          cover_image_url?: string
          created_at?: string
          featured?: boolean
          id?: string
          prompt?: string
          ratio?: string
          show_on_studio?: boolean
          sort_order?: number
          studio_sort_order?: number
          title_ar?: string
          title_en: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          cover_image_url?: string
          created_at?: string
          featured?: boolean
          id?: string
          prompt?: string
          ratio?: string
          show_on_studio?: boolean
          sort_order?: number
          studio_sort_order?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      tool_examples: {
        Row: {
          created_at: string
          id: string
          image_url: string
          prompt: string
          sort_order: number
          tool_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string
          prompt?: string
          sort_order?: number
          tool_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          prompt?: string
          sort_order?: number
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_examples_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_providers: {
        Row: {
          created_at: string
          credit_cost: number
          description: string
          display_name: string
          id: string
          internal_cost_usd: number
          is_active: boolean
          is_default: boolean
          provider_endpoint: string
          provider_name: string
          sort_order: number
          tier: string
          tool_id: string
        }
        Insert: {
          created_at?: string
          credit_cost?: number
          description?: string
          display_name?: string
          id?: string
          internal_cost_usd?: number
          is_active?: boolean
          is_default?: boolean
          provider_endpoint?: string
          provider_name?: string
          sort_order?: number
          tier?: string
          tool_id: string
        }
        Update: {
          created_at?: string
          credit_cost?: number
          description?: string
          display_name?: string
          id?: string
          internal_cost_usd?: number
          is_active?: boolean
          is_default?: boolean
          provider_endpoint?: string
          provider_name?: string
          sort_order?: number
          tier?: string
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_providers_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_runs: {
        Row: {
          completed_at: string | null
          confirmed_provider_cost: number | null
          created_at: string
          credits_charged: number
          error_message: string | null
          estimated_provider_cost: number
          failed_at: string | null
          id: string
          input_image_url: string | null
          input_options_json: Json
          input_prompt: string | null
          margin: number
          output_image_url: string | null
          output_images_json: Json
          provider_endpoint: string
          provider_name: string
          revenue: number
          started_at: string | null
          status: string
          tool_id: string | null
          tool_slug: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          confirmed_provider_cost?: number | null
          created_at?: string
          credits_charged?: number
          error_message?: string | null
          estimated_provider_cost?: number
          failed_at?: string | null
          id?: string
          input_image_url?: string | null
          input_options_json?: Json
          input_prompt?: string | null
          margin?: number
          output_image_url?: string | null
          output_images_json?: Json
          provider_endpoint?: string
          provider_name?: string
          revenue?: number
          started_at?: string | null
          status?: string
          tool_id?: string | null
          tool_slug: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          confirmed_provider_cost?: number | null
          created_at?: string
          credits_charged?: number
          error_message?: string | null
          estimated_provider_cost?: number
          failed_at?: string | null
          id?: string
          input_image_url?: string | null
          input_options_json?: Json
          input_prompt?: string | null
          margin?: number
          output_image_url?: string | null
          output_images_json?: Json
          provider_endpoint?: string
          provider_name?: string
          revenue?: number
          started_at?: string | null
          status?: string
          tool_id?: string | null
          tool_slug?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_runs_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          active: boolean
          cover_image_url: string
          created_at: string
          default_credit_cost: number
          description_ar: string
          description_en: string
          featured: boolean
          hero_subtitle_ar: string
          hero_subtitle_en: string
          hero_title_ar: string
          hero_title_en: string
          icon_name: string
          id: string
          input_type: string
          internal_provider_cost_estimate: number
          provider_endpoint: string
          provider_name: string
          result_type: string
          route: string
          short_desc_ar: string
          short_desc_en: string
          slug: string
          sort_order: number
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cover_image_url?: string
          created_at?: string
          default_credit_cost?: number
          description_ar?: string
          description_en?: string
          featured?: boolean
          hero_subtitle_ar?: string
          hero_subtitle_en?: string
          hero_title_ar?: string
          hero_title_en?: string
          icon_name?: string
          id?: string
          input_type?: string
          internal_provider_cost_estimate?: number
          provider_endpoint?: string
          provider_name?: string
          result_type?: string
          route: string
          short_desc_ar?: string
          short_desc_en?: string
          slug: string
          sort_order?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cover_image_url?: string
          created_at?: string
          default_credit_cost?: number
          description_ar?: string
          description_en?: string
          featured?: boolean
          hero_subtitle_ar?: string
          hero_subtitle_en?: string
          hero_title_ar?: string
          hero_title_en?: string
          icon_name?: string
          id?: string
          input_type?: string
          internal_provider_cost_estimate?: number
          provider_endpoint?: string
          provider_name?: string
          result_type?: string
          route?: string
          short_desc_ar?: string
          short_desc_en?: string
          slug?: string
          sort_order?: number
          title_ar?: string
          title_en?: string
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
