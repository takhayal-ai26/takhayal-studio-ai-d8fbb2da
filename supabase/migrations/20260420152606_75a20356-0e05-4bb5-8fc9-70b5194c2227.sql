ALTER TABLE public.generation_logs
  ADD COLUMN IF NOT EXISTS input_image_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS used_image_input boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.generation_logs.input_image_urls IS 'Array of uploaded reference image URLs sent to the provider (empty for pure text-to-image).';
COMMENT ON COLUMN public.generation_logs.used_image_input IS 'True when the generation request included reference images (image-to-image / reference-based).';

CREATE INDEX IF NOT EXISTS generation_logs_used_image_input_idx ON public.generation_logs (used_image_input) WHERE used_image_input = true;