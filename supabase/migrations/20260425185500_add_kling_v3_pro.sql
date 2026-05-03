INSERT INTO public.video_models (
  name,
  display_name,
  fal_endpoint,
  provider,
  supports_audio,
  supports_start_frame,
  start_frame_required,
  supports_end_frame,
  supports_reference_images,
  aspect_ratios,
  resolutions,
  durations,
  credit_cost_per_second_no_audio,
  credit_cost_per_second_with_audio,
  badge,
  is_active,
  sort_order
)
SELECT
  'kling-v3-pro',
  'Kling v3.0 Pro',
  'fal-ai/kling-video/v3/pro/text-to-video',
  'Fal.ai',
  false,
  true,
  false,
  false,
  false,
  '["16:9","9:16","1:1"]'::jsonb,
  '["720p","1080p"]'::jsonb,
  '[5,10]'::jsonb,
  8,
  0,
  'New',
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM public.video_models WHERE name = 'kling-v3-pro'
);
