
-- Pricing Plans
CREATE TABLE public.pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  billing_period text NOT NULL DEFAULT 'monthly',
  included_credits integer NOT NULL DEFAULT 0,
  badge_en text NOT NULL DEFAULT '',
  badge_ar text NOT NULL DEFAULT '',
  cta_label_en text NOT NULL DEFAULT 'Get Started',
  cta_label_ar text NOT NULL DEFAULT '',
  cta_action text NOT NULL DEFAULT 'signup',
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  visible_logged_out boolean NOT NULL DEFAULT true,
  visible_logged_in boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_pricing_plans" ON public.pricing_plans FOR SELECT TO anon USING (true);
CREATE POLICY "auth_all_pricing_plans" ON public.pricing_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Plan Features
CREATE TABLE public.pricing_plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.pricing_plans(id) ON DELETE CASCADE,
  text_en text NOT NULL DEFAULT '',
  text_ar text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);
ALTER TABLE public.pricing_plan_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_plan_features" ON public.pricing_plan_features FOR SELECT TO anon USING (true);
CREATE POLICY "auth_all_plan_features" ON public.pricing_plan_features FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Credit Packages
CREATE TABLE public.credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ar text NOT NULL DEFAULT '',
  credits integer NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  badge_en text NOT NULL DEFAULT '',
  badge_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  cta_label_en text NOT NULL DEFAULT 'Buy',
  cta_label_ar text NOT NULL DEFAULT '',
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_credit_packages" ON public.credit_packages FOR SELECT TO anon USING (true);
CREATE POLICY "auth_all_credit_packages" ON public.credit_packages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Pricing FAQs
CREATE TABLE public.pricing_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_en text NOT NULL DEFAULT '',
  question_ar text NOT NULL DEFAULT '',
  answer_en text NOT NULL DEFAULT '',
  answer_ar text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pricing_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_pricing_faqs" ON public.pricing_faqs FOR SELECT TO anon USING (true);
CREATE POLICY "auth_all_pricing_faqs" ON public.pricing_faqs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Credit Usage Explanations (How credits work cards)
CREATE TABLE public.credit_usage_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  subtitle_en text NOT NULL DEFAULT '',
  subtitle_ar text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'Image',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.credit_usage_explanations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_credit_explanations" ON public.credit_usage_explanations FOR SELECT TO anon USING (true);
CREATE POLICY "auth_all_credit_explanations" ON public.credit_usage_explanations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Pricing Page Content (hero, section titles, etc.)
CREATE TABLE public.pricing_page_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL,
  field_key text NOT NULL,
  value_en text NOT NULL DEFAULT '',
  value_ar text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(section_key, field_key)
);
ALTER TABLE public.pricing_page_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_pricing_page_content" ON public.pricing_page_content FOR SELECT TO anon USING (true);
CREATE POLICY "auth_all_pricing_page_content" ON public.pricing_page_content FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also allow anon insert/update/delete for admin (no auth yet)
CREATE POLICY "anon_all_pricing_plans" ON public.pricing_plans FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_plan_features" ON public.pricing_plan_features FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_credit_packages" ON public.credit_packages FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_pricing_faqs" ON public.pricing_faqs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_credit_explanations" ON public.credit_usage_explanations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_pricing_page_content" ON public.pricing_page_content FOR ALL TO anon USING (true) WITH CHECK (true);
