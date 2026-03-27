
-- Fix Seedream 5.0 Lite endpoint (needs /text-to-image like v4.5)
UPDATE models SET endpoint_id = 'fal-ai/bytedance/seedream/v5/lite/text-to-image', pricing_mode = 'flat_per_image', input_type = 'image_size' WHERE id = 'df5b12f9-a7e0-4c16-8386-4f05ece0e8b2';

-- Add pricing tiers for Seedream 5.0 Lite (similar to v4.5)
INSERT INTO model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, is_active, is_default, pricing_mode)
VALUES
  ('df5b12f9-a7e0-4c16-8386-4f05ece0e8b2', '1K Standard', '1K', 0.04, 4, true, true, 'flat_per_image'),
  ('df5b12f9-a7e0-4c16-8386-4f05ece0e8b2', '2K Standard', '2K', 0.06, 6, true, false, 'flat_per_image'),
  ('df5b12f9-a7e0-4c16-8386-4f05ece0e8b2', '4K Standard', '4K', 0.10, 8, true, false, 'flat_per_image');
