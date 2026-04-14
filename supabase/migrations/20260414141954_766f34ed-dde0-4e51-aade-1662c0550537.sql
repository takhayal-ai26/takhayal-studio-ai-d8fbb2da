
-- Create video_models table
CREATE TABLE public.video_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  fal_endpoint TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT '',
  preview_image_url TEXT DEFAULT '',
  supports_audio BOOLEAN NOT NULL DEFAULT false,
  supports_start_frame BOOLEAN NOT NULL DEFAULT false,
  start_frame_required BOOLEAN NOT NULL DEFAULT false,
  supports_end_frame BOOLEAN NOT NULL DEFAULT false,
  supports_reference_images BOOLEAN NOT NULL DEFAULT false,
  aspect_ratios JSONB NOT NULL DEFAULT '["16:9","9:16","1:1"]'::jsonb,
  resolutions JSONB NOT NULL DEFAULT '["720p"]'::jsonb,
  durations JSONB NOT NULL DEFAULT '[5]'::jsonb,
  credit_cost_per_second_no_audio INTEGER NOT NULL DEFAULT 5,
  credit_cost_per_second_with_audio INTEGER NOT NULL DEFAULT 0,
  badge TEXT DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_models ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Anyone can read video_models"
  ON public.video_models FOR SELECT
  TO public
  USING (true);

-- Admin write
CREATE POLICY "Admin insert video_models"
  ON public.video_models FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update video_models"
  ON public.video_models FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete video_models"
  ON public.video_models FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Timestamp trigger
CREATE TRIGGER update_video_models_updated_at
  BEFORE UPDATE ON public.video_models
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
