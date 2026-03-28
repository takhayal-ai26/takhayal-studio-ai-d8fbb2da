
CREATE TABLE public.platform_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read platform_config" ON public.platform_config FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon update platform_config" ON public.platform_config FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon insert platform_config" ON public.platform_config FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon delete platform_config" ON public.platform_config FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated all platform_config" ON public.platform_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_config;
