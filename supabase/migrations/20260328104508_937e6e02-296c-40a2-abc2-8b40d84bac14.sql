
CREATE TABLE public.tool_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  provider_name text NOT NULL DEFAULT 'fal.ai',
  provider_endpoint text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  credit_cost integer NOT NULL DEFAULT 2,
  internal_cost_usd numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  tier text NOT NULL DEFAULT 'standard',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tool_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read tool_providers" ON public.tool_providers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert tool_providers" ON public.tool_providers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update tool_providers" ON public.tool_providers FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete tool_providers" ON public.tool_providers FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated all tool_providers" ON public.tool_providers FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.tool_providers;
