
ALTER TABLE public.models
  ADD COLUMN IF NOT EXISTS edit_endpoint_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS supports_image_input boolean NOT NULL DEFAULT false;
