
-- Add upscale strategy fields to models
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS upscale_strategy text NOT NULL DEFAULT 'esrgan';
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS supports_native_high_res boolean NOT NULL DEFAULT false;

-- Add detailed metadata columns to generation_logs
ALTER TABLE public.generation_logs ADD COLUMN IF NOT EXISTS requested_ratio text;
ALTER TABLE public.generation_logs ADD COLUMN IF NOT EXISTS requested_quality_tier text;
ALTER TABLE public.generation_logs ADD COLUMN IF NOT EXISTS actual_output_width integer;
ALTER TABLE public.generation_logs ADD COLUMN IF NOT EXISTS actual_output_height integer;
ALTER TABLE public.generation_logs ADD COLUMN IF NOT EXISTS used_upscale_pipeline boolean NOT NULL DEFAULT false;
