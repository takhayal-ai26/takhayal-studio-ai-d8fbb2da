
-- Qwen Image: remove 4K tier (output capped at 1536px by fal.ai)
DELETE FROM model_pricing_tiers WHERE model_id = 'f531bc7e-8f38-4134-848f-42d76b942a1e' AND quality_level = '4K';

-- Qwen Image: update supported_quality_tiers to [1K, 2K] only
UPDATE models SET supported_quality_tiers = '["1K","2K"]'::jsonb WHERE id = 'f531bc7e-8f38-4134-848f-42d76b942a1e';
