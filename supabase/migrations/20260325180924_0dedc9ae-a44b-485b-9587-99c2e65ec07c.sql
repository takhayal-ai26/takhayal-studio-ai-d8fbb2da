CREATE TABLE public.provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL UNIQUE,
  provider_type TEXT NOT NULL DEFAULT 'AI Generation',
  is_connected BOOLEAN NOT NULL DEFAULT false,
  environment TEXT NOT NULL DEFAULT 'production',
  health_status TEXT NOT NULL DEFAULT 'unknown',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  api_key_set BOOLEAN NOT NULL DEFAULT false,
  default_model TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Seed fal.ai as the connected provider
INSERT INTO public.provider_configs (provider_name, provider_type, is_connected, environment, health_status, api_key_set, default_model, config)
VALUES ('Fal.ai', 'AI Generation', true, 'production', 'healthy', true, 'flux-schnell', '{"models": ["flux-schnell", "flux-dev", "flux-pro"], "base_url": "https://queue.fal.run"}');

-- Insert other providers as not connected
INSERT INTO public.provider_configs (provider_name, provider_type, is_connected, default_model) VALUES
  ('Replicate', 'AI Generation', false, null),
  ('Stability AI', 'AI Generation', false, null),
  ('OpenAI', 'AI Enhancement', false, null);

ALTER TABLE public.provider_configs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read" ON public.provider_configs FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to update (admin-only in practice)
CREATE POLICY "Allow authenticated update" ON public.provider_configs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);