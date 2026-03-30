
-- ============================================================
-- FIX 1: Remove "Anon can read profiles" and "Anon can insert profiles"
-- ============================================================
DROP POLICY IF EXISTS "Anon can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anon can insert profiles" ON public.profiles;

-- ============================================================
-- FIX 2: platform_config — remove anon write + authenticated ALL
-- ============================================================
DROP POLICY IF EXISTS "Allow anon delete platform_config" ON public.platform_config;
DROP POLICY IF EXISTS "Allow authenticated all platform_config" ON public.platform_config;

-- Add proper authenticated read policy for platform_config
CREATE POLICY "Authenticated read platform_config"
  ON public.platform_config FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- FIX 3: Remove leftover permissive ALL policies on pricing tables
-- ============================================================
-- pricing_faqs
DROP POLICY IF EXISTS "anon_all_pricing_faqs" ON public.pricing_faqs;
DROP POLICY IF EXISTS "auth_all_pricing_faqs" ON public.pricing_faqs;

-- pricing_plans
DROP POLICY IF EXISTS "anon_all_pricing_plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "auth_all_pricing_plans" ON public.pricing_plans;

-- pricing_page_content
DROP POLICY IF EXISTS "anon_all_pricing_page_content" ON public.pricing_page_content;
DROP POLICY IF EXISTS "auth_all_pricing_page_content" ON public.pricing_page_content;

-- pricing_plan_features
DROP POLICY IF EXISTS "anon_all_plan_features" ON public.pricing_plan_features;
DROP POLICY IF EXISTS "auth_all_plan_features" ON public.pricing_plan_features;

-- ============================================================
-- FIX 4: Remove duplicate permissive UPDATE on models & provider_configs
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated update models" ON public.models;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.provider_configs;

-- ============================================================
-- FIX 5: admin_audit_log — restrict public read to admin only
-- ============================================================
DROP POLICY IF EXISTS "Public read audit_log" ON public.admin_audit_log;
CREATE POLICY "Admin read audit_log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- FIX 6: tool_runs — remove anon write/update policies, keep anon read scoped
-- ============================================================
DROP POLICY IF EXISTS "Allow anon update tool_runs" ON public.tool_runs;
DROP POLICY IF EXISTS "Anon insert tool_runs" ON public.tool_runs;
DROP POLICY IF EXISTS "Allow anon read tool_runs" ON public.tool_runs;

-- ============================================================
-- FIX 7: generation_logs — remove anon insert, keep anon read for public gallery
-- ============================================================
DROP POLICY IF EXISTS "Anon insert gen_logs" ON public.generation_logs;

-- ============================================================
-- FIX 8: Storage — restrict tool-files and tool-covers uploads to authenticated
-- ============================================================
DROP POLICY IF EXISTS "Allow anon upload tool-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon upload tool-covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon update tool-covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon delete tool-covers" ON storage.objects;

-- Add authenticated upload policies
CREATE POLICY "Auth upload tool-files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tool-files');

CREATE POLICY "Auth upload tool-covers"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tool-covers');

CREATE POLICY "Auth update tool-covers"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'tool-covers');

CREATE POLICY "Auth delete tool-covers"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tool-covers');

-- ============================================================
-- FIX 9: Add authenticated read policies where needed (pricing tables)
-- These tables already have anon read + admin write, just need auth read
-- ============================================================
CREATE POLICY "Authenticated read pricing_faqs"
  ON public.pricing_faqs FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated read pricing_plans"
  ON public.pricing_plans FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated read pricing_page_content"
  ON public.pricing_page_content FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated read pricing_plan_features"
  ON public.pricing_plan_features FOR SELECT TO authenticated
  USING (true);
