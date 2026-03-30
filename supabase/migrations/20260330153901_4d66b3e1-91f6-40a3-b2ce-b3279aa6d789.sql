-- Drop overly permissive write policies and replace with admin-only

-- admin_audit_log
DROP POLICY IF EXISTS "Allow anon all admin_audit_log" ON public.admin_audit_log;
DROP POLICY IF EXISTS "Allow authenticated all admin_audit_log" ON public.admin_audit_log;
CREATE POLICY "Public read audit_log" ON public.admin_audit_log FOR SELECT USING (true);
CREATE POLICY "Admin write audit_log" ON public.admin_audit_log FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update audit_log" ON public.admin_audit_log FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete audit_log" ON public.admin_audit_log FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- credit_packages
DROP POLICY IF EXISTS "anon_all_credit_packages" ON public.credit_packages;
DROP POLICY IF EXISTS "auth_all_credit_packages" ON public.credit_packages;
CREATE POLICY "Admin write credit_packages" ON public.credit_packages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update credit_packages" ON public.credit_packages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete credit_packages" ON public.credit_packages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- credit_settings
DROP POLICY IF EXISTS "Allow anon update credit_settings" ON public.credit_settings;
DROP POLICY IF EXISTS "Allow authenticated update credit_settings" ON public.credit_settings;
CREATE POLICY "Admin update credit_settings" ON public.credit_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- credit_usage_explanations
DROP POLICY IF EXISTS "anon_all_credit_explanations" ON public.credit_usage_explanations;
DROP POLICY IF EXISTS "auth_all_credit_explanations" ON public.credit_usage_explanations;
CREATE POLICY "Admin write credit_explanations" ON public.credit_usage_explanations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update credit_explanations" ON public.credit_usage_explanations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete credit_explanations" ON public.credit_usage_explanations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- generation_logs
DROP POLICY IF EXISTS "Allow anon insert generation_logs" ON public.generation_logs;
DROP POLICY IF EXISTS "Allow authenticated all generation_logs" ON public.generation_logs;
CREATE POLICY "User insert own gen_logs" ON public.generation_logs FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Anon insert gen_logs" ON public.generation_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Admin update gen_logs" ON public.generation_logs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete gen_logs" ON public.generation_logs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- legal_policies
DROP POLICY IF EXISTS "Allow anon insert legal_policies" ON public.legal_policies;
DROP POLICY IF EXISTS "Allow anon update legal_policies" ON public.legal_policies;
DROP POLICY IF EXISTS "Allow authenticated all legal_policies" ON public.legal_policies;
CREATE POLICY "Admin write legal_policies" ON public.legal_policies FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update legal_policies" ON public.legal_policies FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete legal_policies" ON public.legal_policies FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- model_pricing_tiers
DROP POLICY IF EXISTS "Allow anon delete model_pricing_tiers" ON public.model_pricing_tiers;
DROP POLICY IF EXISTS "Allow anon insert model_pricing_tiers" ON public.model_pricing_tiers;
DROP POLICY IF EXISTS "Allow anon update model_pricing_tiers" ON public.model_pricing_tiers;
DROP POLICY IF EXISTS "Allow authenticated all model_pricing_tiers" ON public.model_pricing_tiers;
CREATE POLICY "Admin write mpt" ON public.model_pricing_tiers FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update mpt" ON public.model_pricing_tiers FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete mpt" ON public.model_pricing_tiers FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- models
DROP POLICY IF EXISTS "Allow anon update models" ON public.models;
DROP POLICY IF EXISTS "Allow authenticated delete models" ON public.models;
DROP POLICY IF EXISTS "Allow authenticated insert models" ON public.models;
CREATE POLICY "Admin write models" ON public.models FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update models" ON public.models FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete models" ON public.models FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- platform_config
DROP POLICY IF EXISTS "Allow anon insert platform_config" ON public.platform_config;
DROP POLICY IF EXISTS "Allow anon update platform_config" ON public.platform_config;
DROP POLICY IF EXISTS "Allow authenticated insert platform_config" ON public.platform_config;
DROP POLICY IF EXISTS "Allow authenticated update platform_config" ON public.platform_config;
CREATE POLICY "Admin write platform_config" ON public.platform_config FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update platform_config" ON public.platform_config FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- pricing_faqs
DROP POLICY IF EXISTS "Allow anon insert pricing_faqs" ON public.pricing_faqs;
DROP POLICY IF EXISTS "Allow anon update pricing_faqs" ON public.pricing_faqs;
DROP POLICY IF EXISTS "Allow anon delete pricing_faqs" ON public.pricing_faqs;
DROP POLICY IF EXISTS "Allow authenticated all pricing_faqs" ON public.pricing_faqs;
CREATE POLICY "Admin write pricing_faqs" ON public.pricing_faqs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update pricing_faqs" ON public.pricing_faqs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete pricing_faqs" ON public.pricing_faqs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- pricing_page_content
DROP POLICY IF EXISTS "Allow anon insert pricing_page_content" ON public.pricing_page_content;
DROP POLICY IF EXISTS "Allow anon update pricing_page_content" ON public.pricing_page_content;
DROP POLICY IF EXISTS "Allow anon delete pricing_page_content" ON public.pricing_page_content;
DROP POLICY IF EXISTS "Allow authenticated all pricing_page_content" ON public.pricing_page_content;
CREATE POLICY "Admin write ppc" ON public.pricing_page_content FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update ppc" ON public.pricing_page_content FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete ppc" ON public.pricing_page_content FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- pricing_plan_features
DROP POLICY IF EXISTS "Allow anon insert pricing_plan_features" ON public.pricing_plan_features;
DROP POLICY IF EXISTS "Allow anon update pricing_plan_features" ON public.pricing_plan_features;
DROP POLICY IF EXISTS "Allow anon delete pricing_plan_features" ON public.pricing_plan_features;
DROP POLICY IF EXISTS "Allow authenticated all pricing_plan_features" ON public.pricing_plan_features;
CREATE POLICY "Admin write ppf" ON public.pricing_plan_features FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update ppf" ON public.pricing_plan_features FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete ppf" ON public.pricing_plan_features FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- pricing_plans
DROP POLICY IF EXISTS "Allow anon insert pricing_plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Allow anon update pricing_plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Allow anon delete pricing_plans" ON public.pricing_plans;
DROP POLICY IF EXISTS "Allow authenticated all pricing_plans" ON public.pricing_plans;
CREATE POLICY "Admin write pricing_plans" ON public.pricing_plans FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update pricing_plans" ON public.pricing_plans FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete pricing_plans" ON public.pricing_plans FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- pricing_sync_logs
DROP POLICY IF EXISTS "Allow anon insert pricing_sync_logs" ON public.pricing_sync_logs;
DROP POLICY IF EXISTS "Allow authenticated all pricing_sync_logs" ON public.pricing_sync_logs;
CREATE POLICY "Admin write sync_logs" ON public.pricing_sync_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update sync_logs" ON public.pricing_sync_logs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- profiles
DROP POLICY IF EXISTS "Allow anon insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated all profiles" ON public.profiles;
CREATE POLICY "User insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- provider_configs
DROP POLICY IF EXISTS "Allow anon insert provider_configs" ON public.provider_configs;
DROP POLICY IF EXISTS "Allow anon update provider_configs" ON public.provider_configs;
DROP POLICY IF EXISTS "Allow anon delete provider_configs" ON public.provider_configs;
DROP POLICY IF EXISTS "Allow authenticated all provider_configs" ON public.provider_configs;
CREATE POLICY "Admin write provider_configs" ON public.provider_configs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update provider_configs" ON public.provider_configs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete provider_configs" ON public.provider_configs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- template_categories
DROP POLICY IF EXISTS "Allow anon insert template_categories" ON public.template_categories;
DROP POLICY IF EXISTS "Allow anon update template_categories" ON public.template_categories;
DROP POLICY IF EXISTS "Allow anon delete template_categories" ON public.template_categories;
DROP POLICY IF EXISTS "Allow authenticated all template_categories" ON public.template_categories;
CREATE POLICY "Admin write template_categories" ON public.template_categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update template_categories" ON public.template_categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete template_categories" ON public.template_categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- templates
DROP POLICY IF EXISTS "Allow anon insert templates" ON public.templates;
DROP POLICY IF EXISTS "Allow anon update templates" ON public.templates;
DROP POLICY IF EXISTS "Allow anon delete templates" ON public.templates;
DROP POLICY IF EXISTS "Allow authenticated all templates" ON public.templates;
CREATE POLICY "Admin write templates" ON public.templates FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update templates" ON public.templates FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete templates" ON public.templates FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- tool_examples
DROP POLICY IF EXISTS "Allow anon insert tool_examples" ON public.tool_examples;
DROP POLICY IF EXISTS "Allow anon update tool_examples" ON public.tool_examples;
DROP POLICY IF EXISTS "Allow anon delete tool_examples" ON public.tool_examples;
DROP POLICY IF EXISTS "Allow authenticated all tool_examples" ON public.tool_examples;
CREATE POLICY "Admin write tool_examples" ON public.tool_examples FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update tool_examples" ON public.tool_examples FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete tool_examples" ON public.tool_examples FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- tool_providers
DROP POLICY IF EXISTS "Allow anon insert tool_providers" ON public.tool_providers;
DROP POLICY IF EXISTS "Allow anon update tool_providers" ON public.tool_providers;
DROP POLICY IF EXISTS "Allow anon delete tool_providers" ON public.tool_providers;
DROP POLICY IF EXISTS "Allow authenticated all tool_providers" ON public.tool_providers;
CREATE POLICY "Admin write tool_providers" ON public.tool_providers FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update tool_providers" ON public.tool_providers FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete tool_providers" ON public.tool_providers FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- tool_runs
DROP POLICY IF EXISTS "Allow anon insert tool_runs" ON public.tool_runs;
DROP POLICY IF EXISTS "Allow authenticated all tool_runs" ON public.tool_runs;
CREATE POLICY "User insert own tool_runs" ON public.tool_runs FOR INSERT TO authenticated WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Anon insert tool_runs" ON public.tool_runs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "User read own tool_runs" ON public.tool_runs FOR SELECT TO authenticated USING (auth.uid()::text = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update tool_runs" ON public.tool_runs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete tool_runs" ON public.tool_runs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- tools
DROP POLICY IF EXISTS "Allow anon insert tools" ON public.tools;
DROP POLICY IF EXISTS "Allow anon update tools" ON public.tools;
DROP POLICY IF EXISTS "Allow anon delete tools" ON public.tools;
DROP POLICY IF EXISTS "Allow authenticated all tools" ON public.tools;
CREATE POLICY "Admin write tools" ON public.tools FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update tools" ON public.tools FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete tools" ON public.tools FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- tools_pricing
DROP POLICY IF EXISTS "Allow anon insert tools_pricing" ON public.tools_pricing;
DROP POLICY IF EXISTS "Allow anon update tools_pricing" ON public.tools_pricing;
DROP POLICY IF EXISTS "Allow anon delete tools_pricing" ON public.tools_pricing;
DROP POLICY IF EXISTS "Allow authenticated all tools_pricing" ON public.tools_pricing;
CREATE POLICY "Admin write tools_pricing" ON public.tools_pricing FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update tools_pricing" ON public.tools_pricing FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete tools_pricing" ON public.tools_pricing FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));