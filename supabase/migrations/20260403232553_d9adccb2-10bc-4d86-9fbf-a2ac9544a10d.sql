ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS default_model_id uuid REFERENCES public.models(id) ON DELETE SET NULL DEFAULT NULL;