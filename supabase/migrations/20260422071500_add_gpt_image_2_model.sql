WITH fal_provider AS (
  SELECT id FROM public.provider_configs WHERE provider_name = 'Fal.ai' LIMIT 1
), upserted_model AS (
  INSERT INTO public.models (
    provider_id,
    model_name,
    endpoint_id,
    edit_endpoint_id,
    provider_name,
    speed,
    cost_per_run,
    best_for,
    best_for_ar,
    input_type,
    supported_ratios,
    supported_sizes,
    supported_quality_tiers,
    default_ratio,
    default_resolution,
    max_resolution,
    is_active,
    is_default,
    notes,
    admin_overrides,
    pricing_mode,
    credits_per_generation,
    supports_native_high_res,
    supports_image_input,
    max_image_inputs,
    media_type,
    upscale_strategy,
    preview_image_url
  )
  SELECT
    fal_provider.id,
    'GPT Image 2',
    'fal-ai/gpt-image-2',
    'openai/gpt-image-2/edit',
    'Fal.ai',
    '~18s',
    0.04,
    'Premium ads, product shots, detailed scenes, accurate typography',
    'الإعلانات الفاخرة، صور المنتجات، المشاهد التفصيلية، الكتابة الدقيقة',
    'image_size',
    '["1:1","16:9","9:16","4:3","3:4","4:5","5:4","3:2","2:3"]'::jsonb,
    '["square_hd","square","portrait_4_3","portrait_16_9","landscape_4_3","landscape_16_9"]'::jsonb,
    '["1K","2K"]'::jsonb,
    '4:3',
    'landscape_4_3',
    '3840px edge',
    true,
    false,
    'Native GPT Image 2 text and edit endpoints on fal.ai. Native sizes cap at 3840px max edge.',
    '{
      "supported_ratios": true,
      "supported_quality_tiers": true,
      "default_ratio": true,
      "max_resolution": true,
      "notes": true,
      "pricing_mode": true,
      "supports_image_input": true,
      "edit_endpoint_id": true,
      "max_image_inputs": true,
      "upscale_strategy": true
    }'::jsonb,
    'quality_tier',
    4,
    true,
    true,
    10,
    'image',
    'none',
    ''
  FROM fal_provider
  ON CONFLICT (endpoint_id) DO UPDATE SET
    provider_id = EXCLUDED.provider_id,
    model_name = EXCLUDED.model_name,
    edit_endpoint_id = EXCLUDED.edit_endpoint_id,
    provider_name = EXCLUDED.provider_name,
    speed = EXCLUDED.speed,
    cost_per_run = EXCLUDED.cost_per_run,
    best_for = EXCLUDED.best_for,
    best_for_ar = EXCLUDED.best_for_ar,
    input_type = EXCLUDED.input_type,
    supported_ratios = EXCLUDED.supported_ratios,
    supported_sizes = EXCLUDED.supported_sizes,
    supported_quality_tiers = EXCLUDED.supported_quality_tiers,
    default_ratio = EXCLUDED.default_ratio,
    default_resolution = EXCLUDED.default_resolution,
    max_resolution = EXCLUDED.max_resolution,
    is_active = EXCLUDED.is_active,
    notes = EXCLUDED.notes,
    admin_overrides = EXCLUDED.admin_overrides,
    pricing_mode = EXCLUDED.pricing_mode,
    credits_per_generation = EXCLUDED.credits_per_generation,
    supports_native_high_res = EXCLUDED.supports_native_high_res,
    supports_image_input = EXCLUDED.supports_image_input,
    max_image_inputs = EXCLUDED.max_image_inputs,
    media_type = EXCLUDED.media_type,
    upscale_strategy = EXCLUDED.upscale_strategy,
    preview_image_url = EXCLUDED.preview_image_url,
    updated_at = now()
  RETURNING id
)
DELETE FROM public.model_pricing_tiers
WHERE model_id IN (SELECT id FROM upserted_model);

INSERT INTO public.model_pricing_tiers (
  model_id,
  tier_label,
  quality_level,
  resolution_key,
  resolution_label,
  actual_pixels,
  cost_per_run,
  credits_charged,
  pricing_mode,
  is_active,
  is_default,
  notes
)
SELECT
  id,
  '1K Standard',
  '1K',
  '1024x1024',
  '1K',
  1024,
  0.04,
  4,
  'resolution_based',
  true,
  true,
  'source:migration|endpoint:fal-ai/gpt-image-2|quality:low'
FROM public.models
WHERE endpoint_id = 'fal-ai/gpt-image-2';

INSERT INTO public.model_pricing_tiers (
  model_id,
  tier_label,
  quality_level,
  resolution_key,
  resolution_label,
  actual_pixels,
  cost_per_run,
  credits_charged,
  pricing_mode,
  is_active,
  is_default,
  notes
)
SELECT
  id,
  '2K HD',
  '2K',
  '2048x2048',
  '2K',
  2048,
  0.08,
  6,
  'resolution_based',
  true,
  false,
  'source:migration|endpoint:fal-ai/gpt-image-2|quality:medium'
FROM public.models
WHERE endpoint_id = 'fal-ai/gpt-image-2';
