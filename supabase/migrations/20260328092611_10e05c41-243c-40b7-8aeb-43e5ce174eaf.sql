ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS show_on_studio boolean NOT NULL DEFAULT false;
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS studio_sort_order integer NOT NULL DEFAULT 0;