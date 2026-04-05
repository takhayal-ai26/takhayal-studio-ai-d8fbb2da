ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birthday date DEFAULT NULL;