
-- Models table: single source of truth for all AI models
CREATE TABLE public.models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.provider_configs(id) ON DELETE SET NULL,
  model_name TEXT NOT NULL,
  endpoint_id TEXT NOT NULL UNIQUE,
  provider_name TEXT NOT NULL DEFAULT 'Fal.ai',
  speed TEXT,
  cost_per_run NUMERIC(10,4),
  best_for TEXT,
  input_type TEXT NOT NULL DEFAULT 'image_size' CHECK (input_type IN ('image_size', 'aspect_ratio')),
  supported_ratios JSONB NOT NULL DEFAULT '[]'::jsonb,
  supported_sizes JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_ratio TEXT DEFAULT '1:1',
  default_resolution TEXT DEFAULT '1024x1024',
  max_resolution TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  admin_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read models" ON public.models FOR SELECT TO anon USING (true);
CREATE POLICY "Allow authenticated read models" ON public.models FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated update models" ON public.models FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated insert models" ON public.models FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated delete models" ON public.models FOR DELETE TO authenticated USING (true);

-- Seed the 10 fal.ai models
INSERT INTO public.models (model_name, endpoint_id, provider_name, speed, cost_per_run, best_for, input_type, supported_ratios, supported_sizes, default_ratio, default_resolution, max_resolution, is_active, is_default) VALUES
('Flux Schnell', 'fal-ai/flux/schnell', 'Fal.ai', '~8s', 0.003, 'Fast drafts, iteration', 'image_size',
 '["1:1","16:9","9:16","4:3","3:4","4:5","5:4","3:2","2:3"]',
 '["square_hd","square","landscape_4_3","landscape_16_9","portrait_4_3","portrait_16_9"]',
 '1:1', '1024x1024', '1344x768', true, true),

('Flux Dev', 'fal-ai/flux/dev', 'Fal.ai', '~12s', 0.025, 'Development, testing', 'image_size',
 '["1:1","16:9","9:16","4:3","3:4","4:5","5:4","3:2","2:3"]',
 '["square_hd","square","landscape_4_3","landscape_16_9","portrait_4_3","portrait_16_9"]',
 '1:1', '1024x1024', '1344x768', false, false),

('Flux Pro', 'fal-ai/flux-pro', 'Fal.ai', '~15s', 0.05, 'High quality generation', 'image_size',
 '["1:1","16:9","9:16","4:3","3:4","4:5","5:4","3:2","2:3"]',
 '["square_hd","square","landscape_4_3","landscape_16_9","portrait_4_3","portrait_16_9"]',
 '1:1', '1024x1024', '1344x768', false, false),

('FLUX Pro Ultra', 'fal-ai/flux-pro/v1.1-ultra', 'Fal.ai', '~20s', 0.06, 'Highest quality photorealistic, hero shots, premium ads', 'aspect_ratio',
 '["1:1","16:9","9:16","4:3","3:4","4:5","5:4","3:2","2:3","21:9"]',
 '[]',
 '16:9', '2048x1152', '2048x2048', false, false),

('Ideogram V3', 'fal-ai/ideogram/v3', 'Fal.ai', '~15s', 0.08, 'Arabic/English text overlays, typography, logos, posters', 'aspect_ratio',
 '["1:1","16:9","9:16","4:3","3:4","10:16","16:10","3:2","2:3"]',
 '[]',
 '1:1', '1024x1024', '2048x2048', false, false),

('SDXL Lightning', 'fal-ai/fast-sdxl', 'Fal.ai', '~3s', 0.001, 'Ultra fast previews, high volume generation', 'image_size',
 '["1:1","16:9","9:16","4:3","3:4"]',
 '["square_hd","square","landscape_4_3","landscape_16_9","portrait_4_3","portrait_16_9"]',
 '1:1', '1024x1024', '1024x1024', false, false),

('Stable Diffusion 3.5 Large', 'fal-ai/stable-diffusion-v35-large', 'Fal.ai', '~18s', 0.04, 'Artistic, illustrated, creative editorial', 'image_size',
 '["1:1","16:9","9:16","4:3","3:4","4:5","5:4"]',
 '["square_hd","square","landscape_4_3","landscape_16_9","portrait_4_3","portrait_16_9"]',
 '1:1', '1024x1024', '1344x768', false, false),

('Aura Flow', 'fal-ai/aura-flow', 'Fal.ai', '~12s', 0.02, 'Fashion, beauty, lifestyle photography', 'image_size',
 '["1:1","16:9","9:16","4:3","3:4"]',
 '["square_hd","square","landscape_4_3","landscape_16_9","portrait_4_3","portrait_16_9"]',
 '1:1', '1024x1024', '1024x1024', false, false),

('Recraft V3', 'fal-ai/recraft-v3', 'Fal.ai', '~15s', 0.04, 'Brand design, illustrations, vector-style, icons', 'image_size',
 '["1:1","16:9","9:16","4:3","3:4","4:5","5:4","3:2","2:3"]',
 '["square_hd","square","landscape_4_3","landscape_16_9","portrait_4_3","portrait_16_9"]',
 '1:1', '1024x1024', '1536x1536', false, false),

('Imagen 4', 'fal-ai/imagen4/preview', 'Fal.ai', '~10s', 0.04, 'Photorealistic people, lifestyle, Gulf social content', 'aspect_ratio',
 '["1:1","16:9","9:16","4:3","3:4","3:2","2:3"]',
 '[]',
 '1:1', '1024x1024', '2048x2048', false, false);

-- Enable realtime for models table
ALTER PUBLICATION supabase_realtime ADD TABLE public.models;
