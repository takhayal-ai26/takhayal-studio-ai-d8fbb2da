/**
 * CENTRALIZED COST ENGINE — Single source of truth for all pricing calculations.
 * Used by: frontend (Studio, Tools), backend (edge functions), admin (Pricing Matrix, Models).
 * 
 * Pricing types:
 * - flat_per_image: fixed cost regardless of resolution
 * - per_megapixel: cost scales with pixel count (squared scaling!)
 * - quality_tier: cost mapped to quality level (e.g. Ideogram turbo/balanced/quality)
 * - size_locked: fixed sizes only (e.g. GPT Image 1.5)
 */

export type PricingType = 'flat_per_image' | 'per_megapixel' | 'quality_tier' | 'size_locked' | 'manual_pending';

export const CREDIT_VALUE_USD = 0.016; // 1 credit = $0.016

// ===== BASE RESOLUTION MAP =====
// Standard 1K base dimensions for each aspect ratio
const BASE_DIMS: Record<string, { w: number; h: number }> = {
  '1:1':  { w: 1024, h: 1024 },
  '16:9': { w: 1344, h: 768 },
  '9:16': { w: 768, h: 1344 },
  '4:3':  { w: 1184, h: 896 },
  '3:4':  { w: 896, h: 1184 },
  '4:5':  { w: 896, h: 1120 },
  '5:4':  { w: 1120, h: 896 },
  '3:2':  { w: 1216, h: 832 },
  '2:3':  { w: 832, h: 1216 },
  '21:9': { w: 1536, h: 640 },
};

// ===== QUALITY MULTIPLIERS =====
// Resolution scales: 1K=1x, 2K=2x linear → 4x pixels, 4K=4x linear → 16x pixels
export function getQualityScale(quality: string): number {
  switch (quality) {
    case '4K': return 4;
    case '3K': return 3;
    case '2K': return 2;
    default:   return 1;
  }
}

export function getMegapixels(ratio: string, quality: string): number {
  const base = BASE_DIMS[ratio] || BASE_DIMS['1:1'];
  const scale = getQualityScale(quality);
  const w = base.w * scale;
  const h = base.h * scale;
  return (w * h) / 1_000_000;
}

export function getResolutionDims(ratio: string, quality: string): { width: number; height: number } {
  const base = BASE_DIMS[ratio] || BASE_DIMS['1:1'];
  const scale = getQualityScale(quality);
  return { width: base.w * scale, height: base.h * scale };
}

// ===== MAIN COST CALCULATOR =====
export interface CostResult {
  providerCost: number;
  credits: number;
  revenue: number;
  margin: number;
  marginPct: number;
  megapixels: number;
  width: number;
  height: number;
}

export interface ModelPricingConfig {
  pricingType: PricingType;
  baseCost1k: number;         // Base cost at 1K for per_megapixel, or flat cost
  baseCost2k?: number;        // Override for 2K (flat models with different 2K price)
  baseCost4k?: number;        // Override for 4K (flat models with different 4K price)
  credits1k: number;
  credits2k?: number;
  credits4k?: number;
  creditValueUsd?: number;
}

/**
 * Calculate the cost for a generation given model pricing config, ratio, and quality.
 * This is THE function everyone uses — no duplicated logic anywhere.
 */
export function calculateCost(
  config: ModelPricingConfig,
  ratio: string,
  quality: string,
): CostResult {
  const creditValue = config.creditValueUsd ?? CREDIT_VALUE_USD;
  const dims = getResolutionDims(ratio, quality);
  const mp = (dims.width * dims.height) / 1_000_000;
  
  let providerCost: number;
  let credits: number;

  switch (config.pricingType) {
    case 'per_megapixel': {
      // SQUARED SCALING: cost = base_per_mp × megapixels
      // 1K ≈ 1MP, 2K ≈ 4MP, 4K ≈ 16MP
      const costPerMP = config.baseCost1k; // baseCost1k IS the per-MP rate for this type
      providerCost = costPerMP * mp;
      credits = quality === '4K' ? (config.credits4k ?? config.credits1k * 4)
              : quality === '2K' ? (config.credits2k ?? config.credits1k * 2)
              : config.credits1k;
      break;
    }
    case 'flat_per_image': {
      // Flat models may have different prices per quality
      providerCost = quality === '4K' ? (config.baseCost4k ?? config.baseCost1k)
                   : quality === '2K' ? (config.baseCost2k ?? config.baseCost1k)
                   : config.baseCost1k;
      credits = quality === '4K' ? (config.credits4k ?? config.credits1k)
              : quality === '2K' ? (config.credits2k ?? config.credits1k)
              : config.credits1k;
      break;
    }
    case 'quality_tier': {
      // Quality maps to distinct pricing (e.g. Ideogram turbo/balanced/quality)
      providerCost = quality === '4K' ? (config.baseCost4k ?? config.baseCost1k * 3)
                   : quality === '2K' ? (config.baseCost2k ?? config.baseCost1k * 2)
                   : config.baseCost1k;
      credits = quality === '4K' ? (config.credits4k ?? config.credits1k)
              : quality === '2K' ? (config.credits2k ?? config.credits1k)
              : config.credits1k;
      break;
    }
    case 'size_locked': {
      // Fixed sizes only, cost doesn't change with quality
      providerCost = config.baseCost1k;
      credits = config.credits1k;
      break;
    }
    default: {
      providerCost = config.baseCost1k;
      credits = config.credits1k;
    }
  }

  const revenue = credits * creditValue;
  const margin = revenue - providerCost;
  const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;

  return {
    providerCost,
    credits,
    revenue,
    margin,
    marginPct,
    megapixels: mp,
    width: dims.width,
    height: dims.height,
  };
}

/**
 * Build ModelPricingConfig from a model row + its pricing tiers.
 * This bridges DB data → cost engine.
 */
export function buildModelPricingConfig(
  model: { cost_per_run?: number | null; credits_per_generation?: number | null; pricing_mode?: string },
  tiers: Array<{ quality_level?: string | null; cost_per_run: number; credits_charged: number }>,
  creditValueUsd?: number,
): ModelPricingConfig {
  const pricingType = (model.pricing_mode || 'flat_per_image') as PricingType;
  
  const t1k = tiers.find(t => t.quality_level === '1K');
  const t2k = tiers.find(t => t.quality_level === '2K');
  const t4k = tiers.find(t => t.quality_level === '4K');

  const baseCost1k = t1k?.cost_per_run ?? model.cost_per_run ?? 0;
  const credits1k = t1k?.credits_charged ?? model.credits_per_generation ?? 2;

  return {
    pricingType,
    baseCost1k,
    baseCost2k: t2k?.cost_per_run,
    baseCost4k: t4k?.cost_per_run,
    credits1k,
    credits2k: t2k?.credits_charged,
    credits4k: t4k?.credits_charged,
    creditValueUsd,
  };
}

// ===== VERIFIED PRICING TABLE =====
// Source of truth for known model costs (from fal.ai API docs)
export const VERIFIED_PRICING: Record<string, { type: PricingType; cost1k: number; cost2k?: number; cost4k?: number }> = {
  'fal-ai/flux/schnell':     { type: 'per_megapixel', cost1k: 0.003 },
  'fal-ai/flux-pro/v1.1':   { type: 'per_megapixel', cost1k: 0.04 },
  'fal-ai/qwen-image':      { type: 'per_megapixel', cost1k: 0.02 },
  'fal-ai/gpt-image-2':     { type: 'quality_tier',  cost1k: 0.04, cost2k: 0.08 },
  'openai/gpt-image-2/edit': { type: 'quality_tier',  cost1k: 0.04, cost2k: 0.08 },
  'fal-ai/gpt-image-1.5':   { type: 'size_locked',   cost1k: 0.009 },
  'fal-ai/ideogram/v3':     { type: 'quality_tier',  cost1k: 0.03, cost2k: 0.06, cost4k: 0.09 },
  'fal-ai/imagen4/preview': { type: 'flat_per_image', cost1k: 0.04, cost2k: 0.08 },
  'fal-ai/recraft-v3':      { type: 'flat_per_image', cost1k: 0.04, cost4k: 0.08 },
  'fal-ai/nano-banana-pro':  { type: 'flat_per_image', cost1k: 0.15, cost2k: 0.20, cost4k: 0.30 },
  'fal-ai/nano-banana-2':    { type: 'flat_per_image', cost1k: 0.08, cost2k: 0.12, cost4k: 0.16 },
  'fal-ai/bytedance/seedream/v4.5/text-to-image': { type: 'flat_per_image', cost1k: 0.06, cost2k: 0.08, cost4k: 0.12 },
  'fal-ai/bytedance/seedream/v5/lite/text-to-image': { type: 'flat_per_image', cost1k: 0.04, cost2k: 0.06, cost4k: 0.10 },
};
