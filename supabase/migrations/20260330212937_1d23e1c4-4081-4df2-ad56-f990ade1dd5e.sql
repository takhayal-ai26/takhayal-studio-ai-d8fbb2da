
-- Seed hero config into platform_config
INSERT INTO public.platform_config (config_key, config_value) VALUES
  ('hero_enabled', 'true'),
  ('hero_title_en', 'Turn your ideas into professional visuals'),
  ('hero_title_ar', 'حوّل أفكارك إلى صور احترافية'),
  ('hero_subtitle_en', 'Create ads, content, and visuals in seconds using AI'),
  ('hero_subtitle_ar', 'أنشئ إعلانات ومحتوى ومرئيات في ثوانٍ باستخدام الذكاء الاصطناعي'),
  ('hero_placeholder_en', 'Describe what you want to create...'),
  ('hero_placeholder_ar', 'صِف ما تريد إنشاءه...'),
  ('hero_overlay_opacity', '0.55'),
  ('hero_text_align', 'center'),
  ('hero_background_image', '')
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value, updated_at = now();
