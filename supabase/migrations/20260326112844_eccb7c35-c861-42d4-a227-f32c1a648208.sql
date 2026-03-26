
-- Model pricing tiers: quality/resolution-based pricing rows per model
CREATE TABLE public.model_pricing_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID REFERENCES public.models(id) ON DELETE CASCADE NOT NULL,
  tier_label TEXT NOT NULL DEFAULT 'default',
  quality_level TEXT,
  resolution_key TEXT,
  aspect_ratio TEXT,
  width INTEGER,
  height INTEGER,
  megapixels NUMERIC,
  cost_per_run NUMERIC NOT NULL DEFAULT 0,
  credits_charged INTEGER NOT NULL DEFAULT 2,
  pricing_mode TEXT NOT NULL DEFAULT 'fixed_per_image',
  is_default BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pricing sync logs
CREATE TABLE public.pricing_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.provider_configs(id) ON DELETE SET NULL,
  provider_name TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  synced_models_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add pricing_mode to models table
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS pricing_mode TEXT NOT NULL DEFAULT 'fixed_per_image';

-- RLS for model_pricing_tiers
ALTER TABLE public.model_pricing_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read model_pricing_tiers" ON public.model_pricing_tiers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert model_pricing_tiers" ON public.model_pricing_tiers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update model_pricing_tiers" ON public.model_pricing_tiers FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon delete model_pricing_tiers" ON public.model_pricing_tiers FOR DELETE TO anon USING (true);
CREATE POLICY "Allow authenticated all model_pricing_tiers" ON public.model_pricing_tiers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS for pricing_sync_logs
ALTER TABLE public.pricing_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read pricing_sync_logs" ON public.pricing_sync_logs FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert pricing_sync_logs" ON public.pricing_sync_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow authenticated all pricing_sync_logs" ON public.pricing_sync_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add quality_tier column to generation_logs
ALTER TABLE public.generation_logs ADD COLUMN IF NOT EXISTS quality_tier TEXT;
