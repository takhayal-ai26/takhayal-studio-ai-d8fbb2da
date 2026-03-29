CREATE TABLE public.legal_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL UNIQUE,
  content_en text NOT NULL DEFAULT '',
  content_ar text NOT NULL DEFAULT '',
  last_updated timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read legal_policies" ON public.legal_policies FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon update legal_policies" ON public.legal_policies FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon insert legal_policies" ON public.legal_policies FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow authenticated all legal_policies" ON public.legal_policies FOR ALL TO authenticated USING (true) WITH CHECK (true);