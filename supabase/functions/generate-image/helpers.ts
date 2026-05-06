export const CREDIT_VALUE_USD = 0.016;

export const BASE_DIMS: Record<string, { w: number; h: number }> = {
  "1:1": { w: 1024, h: 1024 }, "16:9": { w: 1344, h: 768 }, "9:16": { w: 768, h: 1344 },
  "4:3": { w: 1184, h: 896 }, "3:4": { w: 896, h: 1184 }, "4:5": { w: 896, h: 1120 },
  "5:4": { w: 1120, h: 896 }, "3:2": { w: 1216, h: 832 }, "2:3": { w: 832, h: 1216 },
  "21:9": { w: 1536, h: 640 },
};

export const GPT_IMAGE_2_MAX_EDGE = 3840;
export const GPT_IMAGE_2_MAX_PIXELS = 8_294_400;
export const GPT_IMAGE_2_MIN_PIXELS = 655_360;

export function isGptImage2Endpoint(endpoint: string) {
  return endpoint === "fal-ai/gpt-image-2"
    || endpoint === "openai/gpt-image-2"
    || endpoint === "fal-ai/gpt-image-2/edit"
    || endpoint === "openai/gpt-image-2/edit";
}

export function normalizeGptImage2Endpoint(endpoint: string) {
  if (endpoint === "fal-ai/gpt-image-2") return "openai/gpt-image-2";
  if (endpoint === "fal-ai/gpt-image-2/edit") return "openai/gpt-image-2/edit";
  return endpoint;
}

export function getQualityScale(q: string): number {
  return q === "4K" ? 4 : q === "3K" ? 3 : q === "2K" ? 2 : 1;
}

export function getResolutionDims(ratio: string, quality: string) {
  const base = BASE_DIMS[ratio] || BASE_DIMS["1:1"];
  const scale = getQualityScale(quality);
  return { width: base.w * scale, height: base.h * scale };
}

const VERIFIED: Record<string, { type: string; cost1k: number; cost2k?: number; cost4k?: number }> = {
  "fal-ai/flux/schnell": { type: "per_megapixel", cost1k: 0.003 },
  "fal-ai/flux-pro/v1.1": { type: "per_megapixel", cost1k: 0.04 },
  "fal-ai/qwen-image": { type: "per_megapixel", cost1k: 0.02 },
  "fal-ai/gpt-image-1.5": { type: "size_locked", cost1k: 0.009 },
  "fal-ai/gpt-image-2": { type: "quality_tier", cost1k: 0.04, cost2k: 0.08 },
  "openai/gpt-image-2": { type: "quality_tier", cost1k: 0.04, cost2k: 0.08 },
  "fal-ai/gpt-image-2/edit": { type: "quality_tier", cost1k: 0.04, cost2k: 0.08 },
  "openai/gpt-image-2/edit": { type: "quality_tier", cost1k: 0.04, cost2k: 0.08 },
  "fal-ai/ideogram/v3": { type: "quality_tier", cost1k: 0.03, cost2k: 0.06, cost4k: 0.09 },
  "fal-ai/imagen4/preview": { type: "flat_per_image", cost1k: 0.04, cost2k: 0.08 },
  "fal-ai/recraft-v3": { type: "flat_per_image", cost1k: 0.04, cost4k: 0.08 },
  "fal-ai/nano-banana-pro": { type: "flat_per_image", cost1k: 0.15, cost2k: 0.20, cost4k: 0.30 },
  "fal-ai/nano-banana-2": { type: "flat_per_image", cost1k: 0.08, cost2k: 0.12, cost4k: 0.16 },
  "fal-ai/bytedance/seedream/v4.5/text-to-image": { type: "flat_per_image", cost1k: 0.06, cost2k: 0.08, cost4k: 0.12 },
  "fal-ai/bytedance/seedream/v5/lite/text-to-image": { type: "flat_per_image", cost1k: 0.04, cost2k: 0.06, cost4k: 0.10 },
  "fal-ai/ideogram/v3/remix": { type: "quality_tier", cost1k: 0.03, cost2k: 0.06, cost4k: 0.09 },
  "fal-ai/flux-pro/v1.1/redux": { type: "per_megapixel", cost1k: 0.04 },
  "fal-ai/flux/schnell/redux": { type: "per_megapixel", cost1k: 0.003 },
  "fal-ai/bytedance/seedream/v4.5/edit": { type: "flat_per_image", cost1k: 0.06, cost2k: 0.08, cost4k: 0.12 },
  "fal-ai/bytedance/seedream/v5/lite/edit": { type: "flat_per_image", cost1k: 0.04, cost2k: 0.06, cost4k: 0.10 },
  "fal-ai/qwen-image-edit-2511": { type: "per_megapixel", cost1k: 0.02 },
};

export function calculateProviderCost(endpoint: string, ratio: string, quality: string, dbBaseCost: number, pricingMode: string): number {
  const verified = VERIFIED[endpoint];
  const type = verified?.type || pricingMode || "flat_per_image";
  if (type === "per_megapixel") {
    const costPerMP = verified?.cost1k || dbBaseCost;
    const dims = getResolutionDims(ratio, quality);
    const mp = (dims.width * dims.height) / 1_000_000;
    return costPerMP * mp;
  }
  if (type === "quality_tier") {
    if (quality === "4K") return verified?.cost4k ?? dbBaseCost * 3;
    if (quality === "2K") return verified?.cost2k ?? dbBaseCost * 2;
    return verified?.cost1k ?? dbBaseCost;
  }
  if (type === "size_locked") return verified?.cost1k ?? dbBaseCost;
  if (quality === "4K") return verified?.cost4k ?? dbBaseCost;
  if (quality === "2K") return verified?.cost2k ?? dbBaseCost;
  return verified?.cost1k ?? dbBaseCost;
}

export function clampGptImage2Dims(ratio: string, quality: string) {
  const baseDims = getResolutionDims(ratio, quality);
  let width = baseDims.width;
  let height = baseDims.height;

  const scaleByEdge = Math.min(1, GPT_IMAGE_2_MAX_EDGE / Math.max(width, height));
  width = Math.floor((width * scaleByEdge) / 16) * 16;
  height = Math.floor((height * scaleByEdge) / 16) * 16;

  const pixels = width * height;
  if (pixels > GPT_IMAGE_2_MAX_PIXELS) {
    const scaleByPixels = Math.sqrt(GPT_IMAGE_2_MAX_PIXELS / pixels);
    width = Math.floor((width * scaleByPixels) / 16) * 16;
    height = Math.floor((height * scaleByPixels) / 16) * 16;
  }

  const pixelsAfterClamp = width * height;
  if (pixelsAfterClamp < GPT_IMAGE_2_MIN_PIXELS) {
    const scaleByMinPixels = Math.sqrt(GPT_IMAGE_2_MIN_PIXELS / pixelsAfterClamp);
    width = Math.ceil((width * scaleByMinPixels) / 16) * 16;
    height = Math.ceil((height * scaleByMinPixels) / 16) * 16;
  }

  return { width, height };
}

export interface ResolvePayloadOptions {
  endpoint: string;
  ratio: string;
  quality: string;
  inputType: string;
  imageUrls?: string[];
}

export function resolvePayload({ endpoint, ratio, quality, inputType, imageUrls = [] }: ResolvePayloadOptions): Record<string, unknown> {
  const allImageUrls = imageUrls;
  const singleUrl = allImageUrls[0] || undefined;

  if (endpoint === "fal-ai/gpt-image-1.5") {
    const sizeMap: Record<string, string> = { "1:1": "1024x1024", "2:3": "1024x1536", "3:2": "1536x1024" };
    const base: Record<string, unknown> = { quality: "low", image_size: sizeMap[ratio] || "1024x1024" };
    if (allImageUrls.length > 1) base.image_urls = allImageUrls;
    else if (singleUrl) base.image_url = singleUrl;
    return base;
  }

  if (isGptImage2Endpoint(endpoint)) {
    const qualityMap: Record<string, string> = { "1K": "low", "2K": "medium", "4K": "high" };
    const dims = clampGptImage2Dims(ratio, quality);
    const base: Record<string, unknown> = {
      quality: qualityMap[quality] || "high",
      image_size: { width: dims.width, height: dims.height },
    };
    if (endpoint.endsWith("/edit") && allImageUrls.length > 0) {
      base.image_urls = allImageUrls;
    }
    return base;
  }

  if (endpoint.includes("ideogram")) {
    const speedMap: Record<string, string> = { "1K": "TURBO", "2K": "BALANCED", "4K": "QUALITY" };
    const base: Record<string, unknown> = { aspect_ratio: ratio, rendering_speed: speedMap[quality] || "TURBO" };
    if (singleUrl) base.image_url = singleUrl;
    if (allImageUrls.length > 1) base.style_image_urls = allImageUrls.slice(1);
    return base;
  }

  if (endpoint.includes("nano-banana")) {
    const base: Record<string, unknown> = { aspect_ratio: ratio, resolution: quality };
    if (allImageUrls.length > 1) base.image_urls = allImageUrls;
    else if (singleUrl) base.image_url = singleUrl;
    return base;
  }

  if (endpoint.includes("imagen4")) return { aspect_ratio: ratio, resolution: quality };

  if (endpoint.includes("seedream") && endpoint.includes("/edit")) {
    const dims = getResolutionDims(ratio, quality);
    const base: Record<string, unknown> = { image_size: { width: dims.width, height: dims.height } };
    if (allImageUrls.length > 0) base.image_urls = allImageUrls;
    return base;
  }

  if (endpoint.includes("seedream")) {
    const dims = getResolutionDims(ratio, quality);
    return { image_size: { width: dims.width, height: dims.height } };
  }

  if (endpoint.includes("/redux")) {
    const dims = getResolutionDims(ratio, quality);
    return { image_url: singleUrl, image_size: { width: dims.width, height: dims.height } };
  }

  if (endpoint.includes("qwen-image-edit")) {
    const dims = getResolutionDims(ratio, quality);
    return { image_url: singleUrl, image_size: { width: dims.width, height: dims.height } };
  }

  if (inputType === "aspect_ratio") {
    const base: Record<string, unknown> = { aspect_ratio: ratio };
    if (singleUrl) base.image_url = singleUrl;
    return base;
  }

  const dims = getResolutionDims(ratio, quality);
  const base: Record<string, unknown> = { image_size: { width: dims.width, height: dims.height } };
  if (singleUrl) base.image_url = singleUrl;
  return base;
}
