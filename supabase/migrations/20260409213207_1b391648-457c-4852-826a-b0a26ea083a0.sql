
-- Add video support columns to models table
ALTER TABLE public.models
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS supported_durations jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS supported_qualities jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS text_to_video_endpoint text,
  ADD COLUMN IF NOT EXISTS image_to_video_endpoint text,
  ADD COLUMN IF NOT EXISTS supports_image_to_video boolean NOT NULL DEFAULT false;

-- Add video support columns to generation_logs table
ALTER TABLE public.generation_logs
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS source_mode text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Add duration column to model_pricing_tiers for video pricing
ALTER TABLE public.model_pricing_tiers
  ADD COLUMN IF NOT EXISTS duration text;
