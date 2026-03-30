INSERT INTO public.platform_config (config_key, config_value) VALUES
  ('dashboard_home_hero_image', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80'),
  ('dashboard_home_title_en', 'What will you create?'),
  ('dashboard_home_title_ar', 'ماذا تريد أن تبدع؟'),
  ('dashboard_home_subtitle_en', ''),
  ('dashboard_home_subtitle_ar', ''),
  ('dashboard_home_prompt_placeholder_en', 'Describe what you want to create...'),
  ('dashboard_home_prompt_placeholder_ar', 'صِف ما تريد إنشاءه...'),
  ('dashboard_home_enabled', 'true'),
  ('dashboard_home_overlay_strength', '0.55')
ON CONFLICT (config_key) DO NOTHING;