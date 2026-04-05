
-- Add guided image tool columns to tools table
ALTER TABLE public.tools
  ADD COLUMN IF NOT EXISTS tool_mode text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS selected_model_id uuid REFERENCES public.models(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS default_prompt_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS default_prompt_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cta_label_en text NOT NULL DEFAULT 'Generate',
  ADD COLUMN IF NOT EXISTS cta_label_ar text NOT NULL DEFAULT 'إنشاء',
  ADD COLUMN IF NOT EXISTS upload_label_en text NOT NULL DEFAULT 'Upload Image',
  ADD COLUMN IF NOT EXISTS upload_label_ar text NOT NULL DEFAULT 'رفع صورة',
  ADD COLUMN IF NOT EXISTS upload_helper_en text NOT NULL DEFAULT 'JPG, PNG up to 10MB',
  ADD COLUMN IF NOT EXISTS upload_helper_ar text NOT NULL DEFAULT 'JPG، PNG حتى 10 ميغابايت',
  ADD COLUMN IF NOT EXISTS requires_upload boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_run boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prompt_hidden boolean NOT NULL DEFAULT false;
