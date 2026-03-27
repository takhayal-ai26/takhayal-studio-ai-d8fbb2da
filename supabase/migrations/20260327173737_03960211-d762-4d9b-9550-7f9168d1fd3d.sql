-- Delete ALL old pricing tiers (they have legacy ESRGAN costs)
DELETE FROM model_pricing_tiers;

-- Insert correct native pricing tiers for active models

-- FLUX 1.1 Pro (per_megapixel: $0.04/MP)
INSERT INTO model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, pricing_mode, is_default, notes) VALUES
('02581c89-4e99-473e-9883-a8ff5e367e6e', '1K Native', '1K', 0.04, 6, 'per_megapixel', true, 'per_megapixel:$0.04/MP×1MP'),
('02581c89-4e99-473e-9883-a8ff5e367e6e', '2K Native', '2K', 0.16, 14, 'per_megapixel', false, 'per_megapixel:$0.04/MP×4MP'),
('02581c89-4e99-473e-9883-a8ff5e367e6e', '4K Native', '4K', 0.64, 50, 'per_megapixel', false, 'per_megapixel:$0.04/MP×16MP');

-- Flux Schnell (per_megapixel: $0.003/MP)
INSERT INTO model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, pricing_mode, is_default, notes) VALUES
('43e8d5f0-6ee5-4bf4-8620-aafec90c8600', '1K Native', '1K', 0.003, 2, 'per_megapixel', true, 'per_megapixel:$0.003/MP×1MP'),
('43e8d5f0-6ee5-4bf4-8620-aafec90c8600', '2K Native', '2K', 0.012, 4, 'per_megapixel', false, 'per_megapixel:$0.003/MP×4MP'),
('43e8d5f0-6ee5-4bf4-8620-aafec90c8600', '4K Native', '4K', 0.048, 8, 'per_megapixel', false, 'per_megapixel:$0.003/MP×16MP');

-- GPT Image 1.5 (size_locked: $0.009 fixed)
INSERT INTO model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, pricing_mode, is_default, notes) VALUES
('e61fd0a2-8658-4e7b-9a81-a28fedf3ee30', '1K Locked', '1K', 0.009, 6, 'size_locked', true, 'size_locked:1024x1024|quality:low');

-- Ideogram V3 (quality_tier: turbo/balanced/quality)
INSERT INTO model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, pricing_mode, is_default, notes) VALUES
('8a15d378-cb48-455b-8cb4-0f1322cd37b9', '1K Turbo', '1K', 0.03, 4, 'quality_tier', true, 'quality_tier:TURBO'),
('8a15d378-cb48-455b-8cb4-0f1322cd37b9', '2K Balanced', '2K', 0.06, 6, 'quality_tier', false, 'quality_tier:BALANCED'),
('8a15d378-cb48-455b-8cb4-0f1322cd37b9', '4K Quality', '4K', 0.09, 8, 'quality_tier', false, 'quality_tier:QUALITY');

-- Imagen 4 (flat_per_image: $0.04)
INSERT INTO model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, pricing_mode, is_default, notes) VALUES
('74813fd7-a6e0-46b8-8ac3-59cf34de99c6', '1K Standard', '1K', 0.04, 6, 'flat_per_image', true, 'flat:$0.04');

-- Nano Banana 2 (flat: $0.08/$0.12/$0.16)
INSERT INTO model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, pricing_mode, is_default, notes) VALUES
('582df12f-1c11-4abe-beaf-9905cd8f1d47', '1K Standard', '1K', 0.08, 10, 'flat_per_image', true, 'flat:$0.08'),
('582df12f-1c11-4abe-beaf-9905cd8f1d47', '2K HD', '2K', 0.12, 12, 'flat_per_image', false, 'flat:$0.12'),
('582df12f-1c11-4abe-beaf-9905cd8f1d47', '4K Ultra', '4K', 0.16, 16, 'flat_per_image', false, 'flat:$0.16');

-- Nano Banana Pro (flat: $0.15/$0.30)
INSERT INTO model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, pricing_mode, is_default, notes) VALUES
('b4728c72-6a85-4673-8aaa-dcfcb1676f2f', '1K Standard', '1K', 0.15, 18, 'flat_per_image', true, 'flat:$0.15'),
('b4728c72-6a85-4673-8aaa-dcfcb1676f2f', '4K Ultra', '4K', 0.30, 30, 'flat_per_image', false, 'flat:$0.30');

-- Qwen Image (per_megapixel: $0.02/MP)
INSERT INTO model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, pricing_mode, is_default, notes) VALUES
('f531bc7e-8f38-4134-848f-42d76b942a1e', '1K Native', '1K', 0.02, 4, 'per_megapixel', true, 'per_megapixel:$0.02/MP×1MP'),
('f531bc7e-8f38-4134-848f-42d76b942a1e', '2K Native', '2K', 0.08, 8, 'per_megapixel', false, 'per_megapixel:$0.02/MP×4MP'),
('f531bc7e-8f38-4134-848f-42d76b942a1e', '4K Native', '4K', 0.32, 28, 'per_megapixel', false, 'per_megapixel:$0.02/MP×16MP');

-- Recraft V3 (flat: $0.04, 4K=$0.08)
INSERT INTO model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, pricing_mode, is_default, notes) VALUES
('77ee31b3-ddb2-49b8-94ee-e6eac6359f8f', '1K Standard', '1K', 0.04, 5, 'flat_per_image', true, 'flat:$0.04'),
('77ee31b3-ddb2-49b8-94ee-e6eac6359f8f', '4K Ultra', '4K', 0.08, 8, 'flat_per_image', false, 'flat:$0.08');

-- Seedream 4.5 (flat: $0.04, max 2K)
INSERT INTO model_pricing_tiers (model_id, tier_label, quality_level, cost_per_run, credits_charged, pricing_mode, is_default, notes) VALUES
('80225ee4-1930-4431-b484-43b448969b3b', '1K Standard', '1K', 0.04, 4, 'flat_per_image', true, 'flat:$0.04');

-- Update model pricing_mode to correct types
UPDATE models SET pricing_mode = 'per_megapixel' WHERE endpoint_id IN ('fal-ai/flux/schnell', 'fal-ai/flux-pro/v1.1', 'fal-ai/qwen-image');
UPDATE models SET pricing_mode = 'size_locked' WHERE endpoint_id = 'fal-ai/gpt-image-1.5';
UPDATE models SET pricing_mode = 'quality_tier' WHERE endpoint_id = 'fal-ai/ideogram/v3';
UPDATE models SET pricing_mode = 'flat_per_image' WHERE endpoint_id IN ('fal-ai/imagen4/preview', 'fal-ai/recraft-v3', 'fal-ai/nano-banana-pro', 'fal-ai/nano-banana-2', 'fal-ai/bytedance/seedream/v4.5');