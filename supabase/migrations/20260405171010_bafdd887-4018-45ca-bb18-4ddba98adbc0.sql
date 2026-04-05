
ALTER TABLE public.tool_providers
  ADD COLUMN IF NOT EXISTS display_name_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_ar text NOT NULL DEFAULT '';
