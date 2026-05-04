-- Admin CMS coverage: reusable content blocks, global translation overrides,
-- and admin-managed SEO landing pages.

CREATE TABLE IF NOT EXISTS public.content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  location text NOT NULL DEFAULT 'global',
  type text NOT NULL DEFAULT 'content',
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  body_en text NOT NULL DEFAULT '',
  body_ar text NOT NULL DEFAULT '',
  media_url text NOT NULL DEFAULT '',
  cta_label_en text NOT NULL DEFAULT '',
  cta_label_ar text NOT NULL DEFAULT '',
  cta_url text NOT NULL DEFAULT '',
  visible boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'scheduled', 'archived')),
  start_at timestamptz,
  end_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_blocks_public
  ON public.content_blocks (location, status, visible, sort_order);

CREATE INDEX IF NOT EXISTS idx_content_blocks_dates
  ON public.content_blocks (start_at, end_at);

ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published content blocks" ON public.content_blocks;
CREATE POLICY "Public read published content blocks"
  ON public.content_blocks FOR SELECT
  USING (
    visible = true
    AND status = 'active'
    AND (start_at IS NULL OR start_at <= now())
    AND (end_at IS NULL OR end_at >= now())
  );

DROP POLICY IF EXISTS "Admin read all content blocks" ON public.content_blocks;
CREATE POLICY "Admin read all content blocks"
  ON public.content_blocks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin insert content blocks" ON public.content_blocks;
CREATE POLICY "Admin insert content blocks"
  ON public.content_blocks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin update content blocks" ON public.content_blocks;
CREATE POLICY "Admin update content blocks"
  ON public.content_blocks FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin delete content blocks" ON public.content_blocks;
CREATE POLICY "Admin delete content blocks"
  ON public.content_blocks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_content_blocks_updated_at ON public.content_blocks;
CREATE TRIGGER update_content_blocks_updated_at
  BEFORE UPDATE ON public.content_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.translation_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  section text NOT NULL DEFAULT 'General',
  value_en text NOT NULL DEFAULT '',
  value_ar text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_translation_overrides_section
  ON public.translation_overrides (section, key);

ALTER TABLE public.translation_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read translation overrides" ON public.translation_overrides;
CREATE POLICY "Public read translation overrides"
  ON public.translation_overrides FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin insert translation overrides" ON public.translation_overrides;
CREATE POLICY "Admin insert translation overrides"
  ON public.translation_overrides FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin update translation overrides" ON public.translation_overrides;
CREATE POLICY "Admin update translation overrides"
  ON public.translation_overrides FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin delete translation overrides" ON public.translation_overrides;
CREATE POLICY "Admin delete translation overrides"
  ON public.translation_overrides FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_translation_overrides_updated_at ON public.translation_overrides;
CREATE TRIGGER update_translation_overrides_updated_at
  BEFORE UPDATE ON public.translation_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.seo_landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title jsonb NOT NULL DEFAULT '{"en":"","ar":""}'::jsonb,
  description jsonb NOT NULL DEFAULT '{"en":"","ar":""}'::jsonb,
  eyebrow jsonb NOT NULL DEFAULT '{"en":"","ar":""}'::jsonb,
  h1 jsonb NOT NULL DEFAULT '{"en":"","ar":""}'::jsonb,
  direct_answer jsonb NOT NULL DEFAULT '{"en":"","ar":""}'::jsonb,
  table_headings jsonb NOT NULL DEFAULT '{"en":[],"ar":[]}'::jsonb,
  table_rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  use_cases jsonb NOT NULL DEFAULT '{"en":[],"ar":[]}'::jsonb,
  limitations jsonb NOT NULL DEFAULT '{"en":[],"ar":[]}'::jsonb,
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  date_modified date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_landing_pages_active_slug
  ON public.seo_landing_pages (active, slug);

ALTER TABLE public.seo_landing_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active SEO landing pages" ON public.seo_landing_pages;
CREATE POLICY "Public read active SEO landing pages"
  ON public.seo_landing_pages FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "Admin read all SEO landing pages" ON public.seo_landing_pages;
CREATE POLICY "Admin read all SEO landing pages"
  ON public.seo_landing_pages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin insert SEO landing pages" ON public.seo_landing_pages;
CREATE POLICY "Admin insert SEO landing pages"
  ON public.seo_landing_pages FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin update SEO landing pages" ON public.seo_landing_pages;
CREATE POLICY "Admin update SEO landing pages"
  ON public.seo_landing_pages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin delete SEO landing pages" ON public.seo_landing_pages;
CREATE POLICY "Admin delete SEO landing pages"
  ON public.seo_landing_pages FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_seo_landing_pages_updated_at ON public.seo_landing_pages;
CREATE TRIGGER update_seo_landing_pages_updated_at
  BEFORE UPDATE ON public.seo_landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Authenticated read legal_policies" ON public.legal_policies;
CREATE POLICY "Authenticated read legal_policies"
  ON public.legal_policies FOR SELECT TO authenticated
  USING (true);

INSERT INTO public.legal_policies (type, content_en, content_ar, last_updated)
VALUES (
  'refund',
  '<h2>Refund Policy</h2><p>Refund terms can be edited from the admin.</p>',
  '<h2>سياسة الاسترداد</h2><p>يمكن تعديل شروط الاسترداد من لوحة الإدارة.</p>',
  now()
)
ON CONFLICT (type) DO NOTHING;
