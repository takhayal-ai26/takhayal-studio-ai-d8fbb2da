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
      community_posts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          id: string
          image_url: string
          is_featured: boolean
          model: string | null
          prompt: string | null
          quality_or_resolution: string | null
          ratio: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          source_generation_id: string | null
          source_type: string
          status: string
          template_id: string | null
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_featured?: boolean
          model?: string | null
          prompt?: string | null
          quality_or_resolution?: string | null
          ratio?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          source_generation_id?: string | null
          source_type?: string
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_featured?: boolean
          model?: string | null
          prompt?: string | null
          quality_or_resolution?: string | null
          ratio?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          source_generation_id?: string | null
          source_type?: string
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          language: string
          message: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          language?: string
          message: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          language?: string
          message?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          active: boolean
          badge_ar: string
          badge_en: string
          bonus_credits: number
          created_at: string
          credits: number
          cta_label_ar: string
          cta_label_en: string
          currency: string
          description_ar: string
          description_en: string
          featured: boolean
          id: string
          is_popular: boolean
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
          bonus_credits?: number
          created_at?: string
          credits?: number
          cta_label_ar?: string
          cta_label_en?: string
          currency?: string
          description_ar?: string
          description_en?: string
          featured?: boolean
          id?: string
          is_popular?: boolean
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
          bonus_credits?: number
          created_at?: string
          credits?: number
          cta_label_ar?: string
          cta_label_en?: string
          currency?: string
          description_ar?: string
          description_en?: string
          featured?: boolean
          id?: string
          is_popular?: boolean
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
          duration: string | null
          generation_cost: number
          id: string
          image_url: string | null
          is_public: boolean
          is_shared_to_community: boolean
          margin: number
          margin_pct: number
          media_type: string
          model_id: string | null
          profit_usd: number
          prompt: string | null
          provider_cost: number
          provider_id: string | null
          public_id: string | null
          quality_tier: string | null
          ratio: string | null
          requested_quality_tier: string | null
          requested_ratio: string | null
          resolution: string | null
          revenue: number
          revenue_usd: number
          share_count: number
          source_mode: string | null
          status: string
          thumbnail_url: string | null
          tool_id: string | null
          upscale_cost: number
          upscale_model: string | null
          used_upscale_pipeline: boolean
          user_id: string | null
          video_url: string | null
          was_upscaled: boolean
        }
        Insert: {
          actual_api_cost?: number
          actual_output_height?: number | null
          actual_output_width?: number | null
          created_at?: string
          credits_used?: number
          duration?: string | null
          generation_cost?: number
          id?: string
          image_url?: string | null
          is_public?: boolean
          is_shared_to_community?: boolean
          margin?: number
          margin_pct?: number
          media_type?: string
          model_id?: string | null
          profit_usd?: number
          prompt?: string | null
          provider_cost?: number
          provider_id?: string | null
          public_id?: string | null
          quality_tier?: string | null
          ratio?: string | null
          requested_quality_tier?: string | null
          requested_ratio?: string | null
          resolution?: string | null
          revenue?: number
          revenue_usd?: number
          share_count?: number
          source_mode?: string | null
          status?: string
          thumbnail_url?: string | null
          tool_id?: string | null
          upscale_cost?: number
          upscale_model?: string | null
          used_upscale_pipeline?: boolean
          user_id?: string | null
          video_url?: string | null
          was_upscaled?: boolean
        }
        Update: {
          actual_api_cost?: number
          actual_output_height?: number | null
          actual_output_width?: number | null
          created_at?: string
          credits_used?: number
          duration?: string | null
          generation_cost?: number
          id?: string
          image_url?: string | null
          is_public?: boolean
          is_shared_to_community?: boolean
          margin?: number
          margin_pct?: number
          media_type?: string
          model_id?: string | null
          profit_usd?: number
          prompt?: string | null
          provider_cost?: number
          provider_id?: string | null
          public_id?: string | null
          quality_tier?: string | null
          ratio?: string | null
          requested_quality_tier?: string | null
          requested_ratio?: string | null
          resolution?: string | null
          revenue?: number
          revenue_usd?: number
          share_count?: number
          source_mode?: string | null
          status?: string
          thumbnail_url?: string | null
          tool_id?: string | null
          upscale_cost?: number
          upscale_model?: string | null
          used_upscale_pipeline?: boolean
          user_id?: string | null
          video_url?: string | null
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
      model_guides: {
        Row: {
          active: boolean
          best_for_items: Json
          best_for_line_ar: string
          best_for_line_en: string
          comparison_enabled: boolean
          comparison_images: Json
          comparison_model_ids: Json
          created_at: string
          featured: boolean
          icon_url: string
          id: string
          linked_model_id: string | null
          main_image_url: string
          name_ar: string
          name_en: string
          quality: string
          short_description_ar: string
          short_description_en: string
          slug: string
          sort_order: number
          speed: string
          subtitle_ar: string
          subtitle_en: string
          tags_ar: Json
          tags_en: Json
          title_ar: string
          title_en: string
          type: string
          updated_at: string
          video_preview_url: string
        }
        Insert: {
          active?: boolean
          best_for_items?: Json
          best_for_line_ar?: string
          best_for_line_en?: string
          comparison_enabled?: boolean
          comparison_images?: Json
          comparison_model_ids?: Json
          created_at?: string
          featured?: boolean
          icon_url?: string
          id?: string
          linked_model_id?: string | null
          main_image_url?: string
          name_ar?: string
          name_en?: string
          quality?: string
          short_description_ar?: string
          short_description_en?: string
          slug: string
          sort_order?: number
          speed?: string
          subtitle_ar?: string
          subtitle_en?: string
          tags_ar?: Json
          tags_en?: Json
          title_ar?: string
          title_en?: string
          type?: string
          updated_at?: string
          video_preview_url?: string
        }
        Update: {
          active?: boolean
          best_for_items?: Json
          best_for_line_ar?: string
          best_for_line_en?: string
          comparison_enabled?: boolean
          comparison_images?: Json
          comparison_model_ids?: Json
          created_at?: string
          featured?: boolean
          icon_url?: string
          id?: string
          linked_model_id?: string | null
          main_image_url?: string
          name_ar?: string
          name_en?: string
          quality?: string
          short_description_ar?: string
          short_description_en?: string
          slug?: string
          sort_order?: number
          speed?: string
          subtitle_ar?: string
          subtitle_en?: string
          tags_ar?: Json
          tags_en?: Json
          title_ar?: string
          title_en?: string
          type?: string
          updated_at?: string
          video_preview_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_guides_linked_model_id_fkey"
            columns: ["linked_model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      model_pricing_tiers: {
        Row: {
          actual_pixels: number | null
          aspect_ratio: string | null
          cost_per_run: number
          created_at: string
          credits_charged: number
          duration: string | null
          height: number | null
          id: string
          is_active: boolean
          is_available: boolean
          is_default: boolean
          megapixels: number | null
          model_id: string
          notes: string | null
          pricing_mode: string
          quality_level: string | null
          resolution_key: string | null
          resolution_label: string | null
          tier_label: string
          updated_at: string
          width: number | null
        }
        Insert: {
          actual_pixels?: number | null
          aspect_ratio?: string | null
          cost_per_run?: number
          created_at?: string
          credits_charged?: number
          duration?: string | null
          height?: number | null
          id?: string
          is_active?: boolean
          is_available?: boolean
          is_default?: boolean
          megapixels?: number | null
          model_id: string
          notes?: string | null
          pricing_mode?: string
          quality_level?: string | null
          resolution_key?: string | null
          resolution_label?: string | null
          tier_label?: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          actual_pixels?: number | null
          aspect_ratio?: string | null
          cost_per_run?: number
          created_at?: string
          credits_charged?: number
          duration?: string | null
          height?: number | null
          id?: string
          is_active?: boolean
          is_available?: boolean
          is_default?: boolean
          megapixels?: number | null
          model_id?: string
          notes?: string | null
          pricing_mode?: string
          quality_level?: string | null
          resolution_key?: string | null
          resolution_label?: string | null
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
      model_test_log: {
        Row: {
          actual_pixels_returned: number | null
          error_message: string | null
          expected_pixels: number
          id: string
          model_id: string
          passed: boolean
          resolution_label: string
          tested_at: string
          tested_by: string | null
        }
        Insert: {
          actual_pixels_returned?: number | null
          error_message?: string | null
          expected_pixels: number
          id?: string
          model_id: string
          passed?: boolean
          resolution_label: string
          tested_at?: string
          tested_by?: string | null
        }
        Update: {
          actual_pixels_returned?: number | null
          error_message?: string | null
          expected_pixels?: number
          id?: string
          model_id?: string
          passed?: boolean
          resolution_label?: string
          tested_at?: string
          tested_by?: string | null
        }
        Relationships: []
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
          edit_endpoint_id: string | null
          endpoint_id: string
          id: string
          image_to_video_endpoint: string | null
          input_type: string
          is_active: boolean
          is_default: boolean
          last_sync_at: string | null
          max_image_inputs: number
          max_resolution: string | null
          media_type: string
          model_name: string
          notes: string | null
          preview_image_url: string | null
          pricing_mode: string
          provider_id: string | null
          provider_name: string
          speed: string | null
          supported_durations: Json
          supported_qualities: Json
          supported_quality_tiers: Json
          supported_ratios: Json
          supported_sizes: Json
          supports_image_input: boolean
          supports_image_to_video: boolean
          supports_native_high_res: boolean
          text_to_video_endpoint: string | null
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
          edit_endpoint_id?: string | null
          endpoint_id: string
          id?: string
          image_to_video_endpoint?: string | null
          input_type?: string
          is_active?: boolean
          is_default?: boolean
          last_sync_at?: string | null
          max_image_inputs?: number
          max_resolution?: string | null
          media_type?: string
          model_name: string
          notes?: string | null
          preview_image_url?: string | null
          pricing_mode?: string
          provider_id?: string | null
          provider_name?: string
          speed?: string | null
          supported_durations?: Json
          supported_qualities?: Json
          supported_quality_tiers?: Json
          supported_ratios?: Json
          supported_sizes?: Json
          supports_image_input?: boolean
          supports_image_to_video?: boolean
          supports_native_high_res?: boolean
          text_to_video_endpoint?: string | null
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
          edit_endpoint_id?: string | null
          endpoint_id?: string
          id?: string
          image_to_video_endpoint?: string | null
          input_type?: string
          is_active?: boolean
          is_default?: boolean
          last_sync_at?: string | null
          max_image_inputs?: number
          max_resolution?: string | null
          media_type?: string
          model_name?: string
          notes?: string | null
          preview_image_url?: string | null
          pricing_mode?: string
          provider_id?: string | null
          provider_name?: string
          speed?: string | null
          supported_durations?: Json
          supported_qualities?: Json
          supported_quality_tiers?: Json
          supported_ratios?: Json
          supported_sizes?: Json
          supports_image_input?: boolean
          supports_image_to_video?: boolean
          supports_native_high_res?: boolean
          text_to_video_endpoint?: string | null
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
          annual_discount_percent: number
          badge_ar: string
          badge_en: string
          billing_period: string
          created_at: string
          credits_monthly: number
          cta_action: string
          cta_label_ar: string
          cta_label_en: string
          currency: string
          description_ar: string
          description_en: string
          featured: boolean
          features: Json
          id: string
          included_credits: number
          is_default: boolean
          name_ar: string
          name_en: string
          price: number
          price_annual_monthly_equivalent: number
          price_annual_usd: number
          price_monthly_usd: number
          slug: string
          sort_order: number
          updated_at: string
          visible_logged_in: boolean
          visible_logged_out: boolean
        }
        Insert: {
          active?: boolean
          annual_discount_percent?: number
          badge_ar?: string
          badge_en?: string
          billing_period?: string
          created_at?: string
          credits_monthly?: number
          cta_action?: string
          cta_label_ar?: string
          cta_label_en?: string
          currency?: string
          description_ar?: string
          description_en?: string
          featured?: boolean
          features?: Json
          id?: string
          included_credits?: number
          is_default?: boolean
          name_ar?: string
          name_en: string
          price?: number
          price_annual_monthly_equivalent?: number
          price_annual_usd?: number
          price_monthly_usd?: number
          slug: string
          sort_order?: number
          updated_at?: string
          visible_logged_in?: boolean
          visible_logged_out?: boolean
        }
        Update: {
          active?: boolean
          annual_discount_percent?: number
          badge_ar?: string
          badge_en?: string
          billing_period?: string
          created_at?: string
          credits_monthly?: number
          cta_action?: string
          cta_label_ar?: string
          cta_label_en?: string
          currency?: string
          description_ar?: string
          description_en?: string
          featured?: boolean
          features?: Json
          id?: string
          included_credits?: number
          is_default?: boolean
          name_ar?: string
          name_en?: string
          price?: number
          price_annual_monthly_equivalent?: number
          price_annual_usd?: number
          price_monthly_usd?: number
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
      profiles: {
        Row: {
          avatar_url: string | null
          banned_at: string | null
          banned_reason: string | null
          birthday: string | null
          country: string | null
          created_at: string
          credits: number
          email: string
          first_login_complete: boolean
          first_name: string
          full_name: string
          id: string
          language: string
          last_name: string
          last_sign_in_at: string | null
          plan: string
          status: string
          suspended_reason: string | null
          suspended_until: string | null
          theme_preference: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string
          credits?: number
          email?: string
          first_login_complete?: boolean
          first_name?: string
          full_name?: string
          id?: string
          language?: string
          last_name?: string
          last_sign_in_at?: string | null
          plan?: string
          status?: string
          suspended_reason?: string | null
          suspended_until?: string | null
          theme_preference?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          birthday?: string | null
          country?: string | null
          created_at?: string
          credits?: number
          email?: string
          first_login_complete?: boolean
          first_name?: string
          full_name?: string
          id?: string
          language?: string
          last_name?: string
          last_sign_in_at?: string | null
          plan?: string
          status?: string
          suspended_reason?: string | null
          suspended_until?: string | null
          theme_preference?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      promo_banners: {
        Row: {
          active: boolean
          audience: string
          background_style: string
          badge_ar: string
          badge_en: string
          created_at: string
          cta_action_type: string
          cta_label_ar: string
          cta_label_en: string
          cta_url: string
          dismissal_days: number
          dismissible: boolean
          end_date: string | null
          id: string
          sort_order: number
          start_date: string | null
          subtitle_ar: string
          subtitle_en: string
          text_color: string
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          audience?: string
          background_style?: string
          badge_ar?: string
          badge_en?: string
          created_at?: string
          cta_action_type?: string
          cta_label_ar?: string
          cta_label_en?: string
          cta_url?: string
          dismissal_days?: number
          dismissible?: boolean
          end_date?: string | null
          id?: string
          sort_order?: number
          start_date?: string | null
          subtitle_ar?: string
          subtitle_en?: string
          text_color?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          audience?: string
          background_style?: string
          badge_ar?: string
          badge_en?: string
          created_at?: string
          cta_action_type?: string
          cta_label_ar?: string
          cta_label_en?: string
          cta_url?: string
          dismissal_days?: number
          dismissible?: boolean
          end_date?: string | null
          id?: string
          sort_order?: number
          start_date?: string | null
          subtitle_ar?: string
          subtitle_en?: string
          text_color?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
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
          default_model_id: string | null
          featured: boolean
          height: number | null
          id: string
          prompt: string
          prompt_ar: string
          ratio: string
          show_on_studio: boolean
          sort_order: number
          studio_sort_order: number
          title_ar: string
          title_en: string
          updated_at: string
          width: number | null
        }
        Insert: {
          active?: boolean
          category?: string
          cover_image_url?: string
          created_at?: string
          default_model_id?: string | null
          featured?: boolean
          height?: number | null
          id?: string
          prompt?: string
          prompt_ar?: string
          ratio?: string
          show_on_studio?: boolean
          sort_order?: number
          studio_sort_order?: number
          title_ar?: string
          title_en: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          active?: boolean
          category?: string
          cover_image_url?: string
          created_at?: string
          default_model_id?: string | null
          featured?: boolean
          height?: number | null
          id?: string
          prompt?: string
          prompt_ar?: string
          ratio?: string
          show_on_studio?: boolean
          sort_order?: number
          studio_sort_order?: number
          title_ar?: string
          title_en?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_default_model_id_fkey"
            columns: ["default_model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          company_ar: string
          company_en: string
          created_at: string
          id: string
          is_active: boolean
          is_featured: boolean
          location_ar: string
          location_en: string
          name_ar: string
          name_en: string
          role_ar: string
          role_en: string
          sort_order: number
          testimonial_ar: string
          testimonial_en: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_ar?: string
          company_en?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          location_ar?: string
          location_en?: string
          name_ar?: string
          name_en?: string
          role_ar?: string
          role_en?: string
          sort_order?: number
          testimonial_ar?: string
          testimonial_en?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_ar?: string
          company_en?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          location_ar?: string
          location_en?: string
          name_ar?: string
          name_en?: string
          role_ar?: string
          role_en?: string
          sort_order?: number
          testimonial_ar?: string
          testimonial_en?: string
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
          description_ar: string
          display_name: string
          display_name_ar: string
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
          description_ar?: string
          display_name?: string
          display_name_ar?: string
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
          description_ar?: string
          display_name?: string
          display_name_ar?: string
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
          auto_run: boolean
          cover_image_url: string
          created_at: string
          cta_label_ar: string
          cta_label_en: string
          default_credit_cost: number
          default_prompt_ar: string
          default_prompt_en: string
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
          prompt_hidden: boolean
          provider_endpoint: string
          provider_name: string
          requires_upload: boolean
          result_type: string
          route: string
          selected_model_id: string | null
          short_desc_ar: string
          short_desc_en: string
          slug: string
          sort_order: number
          title_ar: string
          title_en: string
          tool_mode: string
          updated_at: string
          upload_helper_ar: string
          upload_helper_en: string
          upload_label_ar: string
          upload_label_en: string
        }
        Insert: {
          active?: boolean
          auto_run?: boolean
          cover_image_url?: string
          created_at?: string
          cta_label_ar?: string
          cta_label_en?: string
          default_credit_cost?: number
          default_prompt_ar?: string
          default_prompt_en?: string
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
          prompt_hidden?: boolean
          provider_endpoint?: string
          provider_name?: string
          requires_upload?: boolean
          result_type?: string
          route: string
          selected_model_id?: string | null
          short_desc_ar?: string
          short_desc_en?: string
          slug: string
          sort_order?: number
          title_ar?: string
          title_en?: string
          tool_mode?: string
          updated_at?: string
          upload_helper_ar?: string
          upload_helper_en?: string
          upload_label_ar?: string
          upload_label_en?: string
        }
        Update: {
          active?: boolean
          auto_run?: boolean
          cover_image_url?: string
          created_at?: string
          cta_label_ar?: string
          cta_label_en?: string
          default_credit_cost?: number
          default_prompt_ar?: string
          default_prompt_en?: string
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
          prompt_hidden?: boolean
          provider_endpoint?: string
          provider_name?: string
          requires_upload?: boolean
          result_type?: string
          route?: string
          selected_model_id?: string | null
          short_desc_ar?: string
          short_desc_en?: string
          slug?: string
          sort_order?: number
          title_ar?: string
          title_en?: string
          tool_mode?: string
          updated_at?: string
          upload_helper_ar?: string
          upload_helper_en?: string
          upload_label_ar?: string
          upload_label_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "tools_selected_model_id_fkey"
            columns: ["selected_model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
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
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_model_pricing: {
        Row: {
          api_cost_usd: number
          audio_enabled: boolean
          created_at: string
          duration_seconds: number
          id: string
          is_active: boolean
          is_available: boolean
          our_credits: number
          resolution: string
          updated_at: string
          video_model_id: string
        }
        Insert: {
          api_cost_usd?: number
          audio_enabled?: boolean
          created_at?: string
          duration_seconds: number
          id?: string
          is_active?: boolean
          is_available?: boolean
          our_credits?: number
          resolution: string
          updated_at?: string
          video_model_id: string
        }
        Update: {
          api_cost_usd?: number
          audio_enabled?: boolean
          created_at?: string
          duration_seconds?: number
          id?: string
          is_active?: boolean
          is_available?: boolean
          our_credits?: number
          resolution?: string
          updated_at?: string
          video_model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_model_pricing_video_model_id_fkey"
            columns: ["video_model_id"]
            isOneToOne: false
            referencedRelation: "video_models"
            referencedColumns: ["id"]
          },
        ]
      }
      video_models: {
        Row: {
          aspect_ratios: Json
          badge: string | null
          created_at: string
          credit_cost_per_second_no_audio: number
          credit_cost_per_second_with_audio: number
          display_name: string
          durations: Json
          fal_endpoint: string
          id: string
          is_active: boolean
          name: string
          preview_image_url: string | null
          provider: string
          resolutions: Json
          sort_order: number
          start_frame_required: boolean
          supports_audio: boolean
          supports_end_frame: boolean
          supports_reference_images: boolean
          supports_start_frame: boolean
          updated_at: string
        }
        Insert: {
          aspect_ratios?: Json
          badge?: string | null
          created_at?: string
          credit_cost_per_second_no_audio?: number
          credit_cost_per_second_with_audio?: number
          display_name: string
          durations?: Json
          fal_endpoint: string
          id?: string
          is_active?: boolean
          name: string
          preview_image_url?: string | null
          provider?: string
          resolutions?: Json
          sort_order?: number
          start_frame_required?: boolean
          supports_audio?: boolean
          supports_end_frame?: boolean
          supports_reference_images?: boolean
          supports_start_frame?: boolean
          updated_at?: string
        }
        Update: {
          aspect_ratios?: Json
          badge?: string | null
          created_at?: string
          credit_cost_per_second_no_audio?: number
          credit_cost_per_second_with_audio?: number
          display_name?: string
          durations?: Json
          fal_endpoint?: string
          id?: string
          is_active?: boolean
          name?: string
          preview_image_url?: string | null
          provider?: string
          resolutions?: Json
          sort_order?: number
          start_frame_required?: boolean
          supports_audio?: boolean
          supports_end_frame?: boolean
          supports_reference_images?: boolean
          supports_start_frame?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      deduct_credits: {
        Args: {
          p_amount: number
          p_model_id?: string
          p_resolution?: string
          p_tool_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      refund_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
