-- Update model base costs to verified fal.ai invoice amounts
UPDATE public.models SET cost_per_run = 0.003 WHERE endpoint_id = 'fal-ai/flux/schnell';
UPDATE public.models SET cost_per_run = 0.040 WHERE endpoint_id = 'fal-ai/flux-pro/v1.1';
UPDATE public.models SET cost_per_run = 0.009 WHERE endpoint_id = 'fal-ai/gpt-image-1.5';
UPDATE public.models SET cost_per_run = 0.030 WHERE endpoint_id = 'fal-ai/ideogram/v3';
UPDATE public.models SET cost_per_run = 0.040 WHERE endpoint_id = 'fal-ai/imagen4/preview';
UPDATE public.models SET cost_per_run = 0.080 WHERE endpoint_id = 'fal-ai/nano-banana-2';
UPDATE public.models SET cost_per_run = 0.150 WHERE endpoint_id = 'fal-ai/nano-banana-pro';
UPDATE public.models SET cost_per_run = 0.020 WHERE endpoint_id = 'fal-ai/qwen-image';

-- Update credits_per_generation (base 1K credits)
UPDATE public.models SET credits_per_generation = 2 WHERE endpoint_id = 'fal-ai/flux/schnell';
UPDATE public.models SET credits_per_generation = 6 WHERE endpoint_id = 'fal-ai/flux-pro/v1.1';
UPDATE public.models SET credits_per_generation = 6 WHERE endpoint_id = 'fal-ai/gpt-image-1.5';
UPDATE public.models SET credits_per_generation = 4 WHERE endpoint_id = 'fal-ai/ideogram/v3';
UPDATE public.models SET credits_per_generation = 6 WHERE endpoint_id = 'fal-ai/imagen4/preview';
UPDATE public.models SET credits_per_generation = 10 WHERE endpoint_id = 'fal-ai/nano-banana-2';
UPDATE public.models SET credits_per_generation = 18 WHERE endpoint_id = 'fal-ai/nano-banana-pro';
UPDATE public.models SET credits_per_generation = 4 WHERE endpoint_id = 'fal-ai/qwen-image';

-- Ensure all active models support 1K/2K/4K tiers
UPDATE public.models SET supported_quality_tiers = '["1K","2K","4K"]'::jsonb WHERE is_active = true;

-- Delete existing pricing tiers for active models and re-create with exact verified costs
DELETE FROM public.model_pricing_tiers WHERE model_id IN (SELECT id FROM public.models WHERE is_active = true);

-- Flux Schnell: 1K=$0.003, 2K=$0.006, 4K=$0.009
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '1K Standard', '1K', 0.003, 2, true, 'Base generation' FROM public.models WHERE endpoint_id = 'fal-ai/flux/schnell';
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '2K HD', '2K', 0.006, 3, false, 'Base + ESRGAN 2x' FROM public.models WHERE endpoint_id = 'fal-ai/flux/schnell';
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '4K Ultra', '4K', 0.009, 4, false, 'Base + ESRGAN 4x' FROM public.models WHERE endpoint_id = 'fal-ai/flux/schnell';

-- FLUX 1.1 Pro: 1K=$0.040, 2K=$0.043, 4K=$0.046
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '1K Standard', '1K', 0.040, 6, true, 'Base generation' FROM public.models WHERE endpoint_id = 'fal-ai/flux-pro/v1.1';
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '2K HD', '2K', 0.043, 7, false, 'Base + ESRGAN 2x' FROM public.models WHERE endpoint_id = 'fal-ai/flux-pro/v1.1';
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '4K Ultra', '4K', 0.046, 8, false, 'Base + ESRGAN 4x' FROM public.models WHERE endpoint_id = 'fal-ai/flux-pro/v1.1';

-- GPT Image 1.5: 1K=$0.009, 2K=$0.012, 4K=$0.015
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '1K Standard', '1K', 0.009, 6, true, 'Always low quality forced' FROM public.models WHERE endpoint_id = 'fal-ai/gpt-image-1.5';
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '2K HD', '2K', 0.012, 8, false, 'Low quality + ESRGAN 2x' FROM public.models WHERE endpoint_id = 'fal-ai/gpt-image-1.5';
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '4K Ultra', '4K', 0.015, 10, false, 'Low quality + ESRGAN 4x' FROM public.models WHERE endpoint_id = 'fal-ai/gpt-image-1.5';

-- Ideogram V3: 1K=$0.030, 2K=$0.033, 4K=$0.036
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '1K Standard', '1K', 0.030, 4, true, 'Base generation' FROM public.models WHERE endpoint_id = 'fal-ai/ideogram/v3';
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '2K HD', '2K', 0.033, 5, false, 'Base + ESRGAN 2x' FROM public.models WHERE endpoint_id = 'fal-ai/ideogram/v3';
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '4K Ultra', '4K', 0.036, 6, false, 'Base + ESRGAN 4x' FROM public.models WHERE endpoint_id = 'fal-ai/ideogram/v3';

-- Imagen 4: 1K=$0.040, 2K=$0.043, 4K=$0.046
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '1K Standard', '1K', 0.040, 6, true, 'Base generation' FROM public.models WHERE endpoint_id = 'fal-ai/imagen4/preview';
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '2K HD', '2K', 0.043, 7, false, 'Base + ESRGAN 2x' FROM public.models WHERE endpoint_id = 'fal-ai/imagen4/preview';
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '4K Ultra', '4K', 0.046, 8, false, 'Base + ESRGAN 4x' FROM public.models WHERE endpoint_id = 'fal-ai/imagen4/preview';

-- Nano Banana 2: 1K=$0.080, 2K=$0.083, 4K=$0.086
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '1K Standard', '1K', 0.080, 10, true, 'Base generation' FROM public.models WHERE endpoint_id = 'fal-ai/nano-banana-2';
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '2K HD', '2K', 0.083, 11, false, 'Base + ESRGAN 2x' FROM public.models WHERE endpoint_id = 'fal-ai/nano-banana-2';
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '4K Ultra', '4K', 0.086, 12, false, 'Base + ESRGAN 4x' FROM public.models WHERE endpoint_id = 'fal-ai/nano-banana-2';

-- Nano Banana Pro: 1K=$0.150, 2K=$0.153, 4K=$0.156
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '1K Standard', '1K', 0.150, 18, true, 'Base generation' FROM public.models WHERE endpoint_id = 'fal-ai/nano-banana-pro';
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '2K HD', '2K', 0.153, 19, false, 'Base + ESRGAN 2x' FROM public.models WHERE endpoint_id = 'fal-ai/nano-banana-pro';
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '4K Ultra', '4K', 0.156, 20, false, 'Base + ESRGAN 4x' FROM public.models WHERE endpoint_id = 'fal-ai/nano-banana-pro';

-- Qwen Image: 1K=$0.020, 2K=$0.023, 4K=$0.026
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '1K Standard', '1K', 0.020, 4, true, 'Base generation' FROM public.models WHERE endpoint_id = 'fal-ai/qwen-image';
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '2K HD', '2K', 0.023, 5, false, 'Base + ESRGAN 2x' FROM public.models WHERE endpoint_id = 'fal-ai/qwen-image';
INSERT INTO public.model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_default, notes) 
SELECT id, '4K Ultra', '4K', 0.026, 6, false, 'Base + ESRGAN 4x' FROM public.models WHERE endpoint_id = 'fal-ai/qwen-image';

-- Update credit_settings: 1 credit = $0.016
UPDATE public.credit_settings SET credit_value_usd = 0.016;