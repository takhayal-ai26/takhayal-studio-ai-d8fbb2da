
-- Credit settings (global)
CREATE TABLE public.credit_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_value_usd numeric NOT NULL DEFAULT 0.02,
  default_credits_per_generation integer NOT NULL DEFAULT 2,
  min_credits_per_action integer NOT NULL DEFAULT 1,
  rounding_rule text NOT NULL DEFAULT 'ceil',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read credit_settings" ON public.credit_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon update credit_settings" ON public.credit_settings FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read credit_settings" ON public.credit_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated update credit_settings" ON public.credit_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Insert default row
INSERT INTO public.credit_settings (credit_value_usd, default_credits_per_generation, min_credits_per_action) VALUES (0.02, 2, 1);

-- Add credits_per_generation to models table
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS credits_per_generation integer DEFAULT 2;

-- Tools pricing
CREATE TABLE public.tools_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id text NOT NULL UNIQUE,
  tool_name text NOT NULL,
  default_model_id uuid REFERENCES public.models(id),
  credits_per_generation integer NOT NULL DEFAULT 2,
  credit_multiplier numeric NOT NULL DEFAULT 1.0,
  override_model_pricing boolean NOT NULL DEFAULT false,
  free_usage_enabled boolean NOT NULL DEFAULT false,
  max_free_uses integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tools_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read tools_pricing" ON public.tools_pricing FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon update tools_pricing" ON public.tools_pricing FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon insert tools_pricing" ON public.tools_pricing FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow authenticated all tools_pricing" ON public.tools_pricing FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Generation logs
CREATE TABLE public.generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  tool_id text,
  model_id uuid REFERENCES public.models(id),
  provider_id uuid REFERENCES public.provider_configs(id),
  prompt text,
  image_url text,
  credits_used integer NOT NULL DEFAULT 0,
  provider_cost numeric NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  margin numeric NOT NULL DEFAULT 0,
  ratio text,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert generation_logs" ON public.generation_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon read generation_logs" ON public.generation_logs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow authenticated all generation_logs" ON public.generation_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add provider pricing fields
ALTER TABLE public.provider_configs ADD COLUMN IF NOT EXISTS pricing_type text DEFAULT 'per_image';
ALTER TABLE public.provider_configs ADD COLUMN IF NOT EXISTS base_cost numeric DEFAULT 0;
ALTER TABLE public.provider_configs ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';
ALTER TABLE public.provider_configs ADD COLUMN IF NOT EXISTS fallback_cost numeric DEFAULT 0.01;
ALTER TABLE public.provider_configs ADD COLUMN IF NOT EXISTS billing_notes text;

-- Allow anon update on provider_configs
CREATE POLICY "Allow anon update provider_configs" ON public.provider_configs FOR UPDATE TO anon USING (true) WITH CHECK (true);
