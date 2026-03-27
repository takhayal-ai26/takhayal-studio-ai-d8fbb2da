
-- Remove orphan "Vector" tier from Seedream 4.5
DELETE FROM model_pricing_tiers WHERE model_id = '80225ee4-1930-4431-b484-43b448969b3b' AND quality_level = 'vector';

-- Fix Seedream 4.5 input_type to image_size (edge function uses image_size for it)
UPDATE models SET input_type = 'image_size' WHERE id = '80225ee4-1930-4431-b484-43b448969b3b';

-- Fix GPT Image 1.5: ensure supported_quality_tiers is only [1K] (no 2K/4K)
UPDATE models SET supported_quality_tiers = '["1K"]'::jsonb WHERE id = 'e61fd0a2-8658-4e7b-9a81-a28fedf3ee30';

-- Fix Seedream 4.5: supported_quality_tiers confirmed [1K, 2K, 4K] all work
UPDATE models SET supported_quality_tiers = '["1K","2K","4K"]'::jsonb WHERE id = '80225ee4-1930-4431-b484-43b448969b3b';

-- Fix Nano Banana Pro: remove 1K tier (user says 2K + 4K only), update supported_quality_tiers
UPDATE models SET supported_quality_tiers = '["2K","4K"]'::jsonb WHERE id = 'b4728c72-6a85-4673-8aaa-dcfcb1676f2f';
DELETE FROM model_pricing_tiers WHERE model_id = 'b4728c72-6a85-4673-8aaa-dcfcb1676f2f' AND quality_level = '1K';

-- Fix Imagen 4: confirmed only 1K + 2K work
UPDATE models SET supported_quality_tiers = '["1K","2K"]'::jsonb WHERE id = '74813fd7-a6e0-46b8-8ac3-59cf34de99c6';
