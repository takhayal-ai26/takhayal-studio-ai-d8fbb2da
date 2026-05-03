ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS before_image_url text,
  ADD COLUMN IF NOT EXISTS after_image_url text,
  ADD COLUMN IF NOT EXISTS example_caption_en text,
  ADD COLUMN IF NOT EXISTS example_caption_ar text,
  ADD COLUMN IF NOT EXISTS best_results_en text,
  ADD COLUMN IF NOT EXISTS best_results_ar text,
  ADD COLUMN IF NOT EXISTS input_requirements_en text,
  ADD COLUMN IF NOT EXISTS input_requirements_ar text;
