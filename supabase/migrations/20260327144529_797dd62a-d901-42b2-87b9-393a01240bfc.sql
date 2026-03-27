
-- Template categories table
CREATE TABLE public.template_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ar text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read template_categories" ON public.template_categories FOR SELECT TO anon USING (true);
CREATE POLICY "Allow authenticated all template_categories" ON public.template_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Templates table
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_ar text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  cover_image_url text NOT NULL DEFAULT '',
  ratio text NOT NULL DEFAULT '1:1',
  prompt text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read templates" ON public.templates FOR SELECT TO anon USING (true);
CREATE POLICY "Allow authenticated all templates" ON public.templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon insert templates" ON public.templates FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update templates" ON public.templates FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete templates" ON public.templates FOR DELETE TO anon USING (true);
