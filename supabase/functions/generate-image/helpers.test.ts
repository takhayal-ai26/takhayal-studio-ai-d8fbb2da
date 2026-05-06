import { describe, expect, it } from "vitest";
import {
  calculateProviderCost,
  getResolutionDims,
  resolvePayload,
} from "./helpers";

describe("generate-image helpers", () => {
  it("calculates per-megapixel provider costs from requested ratio and quality", () => {
    const cost = calculateProviderCost("fal-ai/flux-pro/v1.1", "16:9", "2K", 0.04, "per_megapixel");

    expect(cost).toBeCloseTo(0.16515072, 8);
  });

  it("uses verified quality tier costs before database fallback", () => {
    expect(calculateProviderCost("fal-ai/ideogram/v3", "1:1", "4K", 99, "flat_per_image")).toBe(0.09);
    expect(calculateProviderCost("unknown/model", "1:1", "2K", 0.05, "quality_tier")).toBe(0.1);
  });

  it("clamps GPT Image 2 dimensions inside provider limits", () => {
    const payload = resolvePayload({
      endpoint: "openai/gpt-image-2",
      ratio: "21:9",
      quality: "4K",
      inputType: "image_size",
      imageUrls: [],
    });

    expect(payload.image_size).toMatchObject({ width: expect.any(Number), height: expect.any(Number) });
    const dims = payload.image_size as { width: number; height: number };
    expect(Math.max(dims.width, dims.height)).toBeLessThanOrEqual(3840);
    expect(dims.width * dims.height).toBeLessThanOrEqual(8_294_400);
  });

  it("resolves edit payloads with image URL arrays", () => {
    expect(resolvePayload({
      endpoint: "fal-ai/bytedance/seedream/v4.5/edit",
      ratio: "1:1",
      quality: "1K",
      inputType: "image_size",
      imageUrls: ["https://cdn.test/a.png", "https://cdn.test/b.png"],
    })).toMatchObject({
      image_urls: ["https://cdn.test/a.png", "https://cdn.test/b.png"],
      image_size: getResolutionDims("1:1", "1K"),
    });
  });
});
