
-- Tools table (replaces zustand adminToolsStore as source of truth)
CREATE TABLE public.tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  route text NOT NULL,
  input_type text NOT NULL DEFAULT 'prompt',
  icon_name text NOT NULL DEFAULT 'Sparkles',
  active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  short_desc_en text NOT NULL DEFAULT '',
  short_desc_ar text NOT NULL DEFAULT '',
  hero_title_en text NOT NULL DEFAULT '',
  hero_title_ar text NOT NULL DEFAULT '',
  hero_subtitle_en text NOT NULL DEFAULT '',
  hero_subtitle_ar text NOT NULL DEFAULT '',
  cover_image_url text NOT NULL DEFAULT '',
  provider_name text NOT NULL DEFAULT 'fal.ai',
  provider_endpoint text NOT NULL DEFAULT '',
  default_credit_cost integer NOT NULL DEFAULT 2,
  internal_provider_cost_estimate numeric NOT NULL DEFAULT 0,
  result_type text NOT NULL DEFAULT 'image',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read tools" ON public.tools FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert tools" ON public.tools FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update tools" ON public.tools FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete tools" ON public.tools FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated all tools" ON public.tools FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tool examples table
CREATE TABLE public.tool_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  image_url text NOT NULL DEFAULT '',
  prompt text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read tool_examples" ON public.tool_examples FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert tool_examples" ON public.tool_examples FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update tool_examples" ON public.tool_examples FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete tool_examples" ON public.tool_examples FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated all tool_examples" ON public.tool_examples FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tool runs table (execution log with full economics)
CREATE TABLE public.tool_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  tool_id uuid REFERENCES public.tools(id),
  tool_slug text NOT NULL,
  provider_name text NOT NULL DEFAULT 'fal.ai',
  provider_endpoint text NOT NULL DEFAULT '',
  input_prompt text,
  input_image_url text,
  input_options_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_image_url text,
  output_images_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  credits_charged integer NOT NULL DEFAULT 0,
  estimated_provider_cost numeric NOT NULL DEFAULT 0,
  confirmed_provider_cost numeric,
  revenue numeric NOT NULL DEFAULT 0,
  margin numeric NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read tool_runs" ON public.tool_runs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert tool_runs" ON public.tool_runs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update tool_runs" ON public.tool_runs FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all tool_runs" ON public.tool_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Storage bucket for tool uploads and outputs
INSERT INTO storage.buckets (id, name, public) VALUES ('tool-files', 'tool-files', true);

CREATE POLICY "Allow public read tool-files" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'tool-files');
CREATE POLICY "Allow anon upload tool-files" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'tool-files');
CREATE POLICY "Allow authenticated all tool-files" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'tool-files') WITH CHECK (bucket_id = 'tool-files');
