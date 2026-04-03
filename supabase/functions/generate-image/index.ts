import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ===== CENTRALIZED COST ENGINE =====
const CREDIT_VALUE_USD = 0.016;

const BASE_DIMS: Record<string, { w: number; h: number }> = {
  "1:1": { w: 1024, h: 1024 }, "16:9": { w: 1344, h: 768 }, "9:16": { w: 768, h: 1344 },
  "4:3": { w: 1184, h: 896 }, "3:4": { w: 896, h: 1184 }, "4:5": { w: 896, h: 1120 },
  "5:4": { w: 1120, h: 896 }, "3:2": { w: 1216, h: 832 }, "2:3": { w: 832, h: 1216 },
  "21:9": { w: 1536, h: 640 },
};

function getQualityScale(q: string): number {
  return q === "4K" ? 4 : q === "3K" ? 3 : q === "2K" ? 2 : 1;
}

function getResolutionDims(ratio: string, quality: string) {
  const base = BASE_DIMS[ratio] || BASE_DIMS["1:1"];
  const s = getQualityScale(quality);
  return { width: base.w * s, height: base.h * s };
}

const VERIFIED: Record<string, { type: string; cost1k: number; cost2k?: number; cost4k?: number }> = {
  "fal-ai/flux/schnell":     { type: "per_megapixel", cost1k: 0.003 },
  "fal-ai/flux-pro/v1.1":   { type: "per_megapixel", cost1k: 0.04 },
  "fal-ai/qwen-image":      { type: "per_megapixel", cost1k: 0.02 },
  "fal-ai/gpt-image-1.5":   { type: "size_locked", cost1k: 0.009 },
  "fal-ai/ideogram/v3":     { type: "quality_tier", cost1k: 0.03, cost2k: 0.06, cost4k: 0.09 },
  "fal-ai/imagen4/preview": { type: "flat_per_image", cost1k: 0.04, cost2k: 0.08 },
  "fal-ai/recraft-v3":      { type: "flat_per_image", cost1k: 0.04, cost4k: 0.08 },
  "fal-ai/nano-banana-pro":  { type: "flat_per_image", cost1k: 0.15, cost2k: 0.20, cost4k: 0.30 },
  "fal-ai/nano-banana-2":    { type: "flat_per_image", cost1k: 0.08, cost2k: 0.12, cost4k: 0.16 },
  "fal-ai/bytedance/seedream/v4.5/text-to-image": { type: "flat_per_image", cost1k: 0.06, cost2k: 0.08, cost4k: 0.12 },
  "fal-ai/bytedance/seedream/v5/lite/text-to-image": { type: "flat_per_image", cost1k: 0.04, cost2k: 0.06, cost4k: 0.10 },
  "fal-ai/ideogram/v3/remix": { type: "quality_tier", cost1k: 0.03, cost2k: 0.06, cost4k: 0.09 },
  "fal-ai/flux-pro/v1.1/redux": { type: "per_megapixel", cost1k: 0.04 },
  "fal-ai/flux/schnell/redux": { type: "per_megapixel", cost1k: 0.003 },
  "fal-ai/bytedance/seedream/v4.5/edit": { type: "flat_per_image", cost1k: 0.06, cost2k: 0.08, cost4k: 0.12 },
  "fal-ai/bytedance/seedream/v5/lite/edit": { type: "flat_per_image", cost1k: 0.04, cost2k: 0.06, cost4k: 0.10 },
  "fal-ai/qwen-image-edit-2511": { type: "per_megapixel", cost1k: 0.02 },
};

function calculateProviderCost(endpoint: string, ratio: string, quality: string, dbBaseCost: number, pricingMode: string): number {
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

// ===== RESOLUTION PAYLOAD RESOLVERS =====
function resolvePayload(endpoint: string, ratio: string, quality: string, inputType: string, imageUrl?: string, imageUrls?: string[]): Record<string, unknown> {
  const hasImages = !!imageUrl || (imageUrls && imageUrls.length > 0);
  const allImageUrls = imageUrls && imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];
  const singleUrl = allImageUrls[0] || undefined;

  // GPT Image 1.5 — same endpoint, accepts image_url (single) or image_urls (multi)
  if (endpoint === "fal-ai/gpt-image-1.5") {
    const sizeMap: Record<string, string> = { "1:1": "1024x1024", "2:3": "1024x1536", "3:2": "1536x1024" };
    const base: Record<string, unknown> = { quality: "low", image_size: sizeMap[ratio] || "1024x1024" };
    if (allImageUrls.length > 1) base.image_urls = allImageUrls;
    else if (singleUrl) base.image_url = singleUrl;
    return base;
  }

  // Ideogram V3 remix — image_url (main) + optional style image_urls
  if (endpoint.includes("ideogram")) {
    const speedMap: Record<string, string> = { "1K": "TURBO", "2K": "BALANCED", "4K": "QUALITY" };
    const base: Record<string, unknown> = { aspect_ratio: ratio, rendering_speed: speedMap[quality] || "TURBO" };
    if (singleUrl) base.image_url = singleUrl;
    if (allImageUrls.length > 1) base.style_image_urls = allImageUrls.slice(1);
    return base;
  }

  // Nano Banana models — accepts image_url for editing
  if (endpoint.includes("nano-banana")) {
    const base: Record<string, unknown> = { aspect_ratio: ratio, resolution: quality };
    if (allImageUrls.length > 1) base.image_urls = allImageUrls;
    else if (singleUrl) base.image_url = singleUrl;
    return base;
  }

  // Imagen 4 — no edit support
  if (endpoint.includes("imagen4")) return { aspect_ratio: ratio, resolution: quality };

  // Seedream edit — accepts image_url (single) or image_urls (multi, up to 10)
  if (endpoint.includes("seedream") && endpoint.includes("/edit")) {
    const dims = getResolutionDims(ratio, quality);
    const base: Record<string, unknown> = { image_size: { width: dims.width, height: dims.height } };
    if (allImageUrls.length > 1) base.image_urls = allImageUrls;
    else if (singleUrl) base.image_url = singleUrl;
    return base;
  }

  // Seedream text-to-image
  if (endpoint.includes("seedream")) {
    const dims = getResolutionDims(ratio, quality);
    return { image_size: { width: dims.width, height: dims.height } };
  }

  // Flux redux (image variation) — single image only
  if (endpoint.includes("/redux")) {
    const dims = getResolutionDims(ratio, quality);
    return { image_url: singleUrl, image_size: { width: dims.width, height: dims.height } };
  }

  // Qwen image edit — single image
  if (endpoint.includes("qwen-image-edit")) {
    const dims = getResolutionDims(ratio, quality);
    return { image_url: singleUrl, image_size: { width: dims.width, height: dims.height } };
  }

  // Default: per-megapixel models
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

// ===== FAL QUEUE RUNNER =====
async function falQueueRun(endpoint: string, payload: Record<string, unknown>, falHeaders: Record<string, string>): Promise<{ data: any; error?: string }> {
  const submitRes = await fetch(`https://queue.fal.run/${endpoint}`, {
    method: "POST", headers: falHeaders, body: JSON.stringify(payload),
  });
  if (!submitRes.ok) {
    const errorText = await submitRes.text();
    console.error(`fal.ai submit error for ${endpoint}:`, submitRes.status, errorText);
    return { data: null, error: `fal.ai API error ${submitRes.status}: ${errorText}` };
  }
  const submitData = await submitRes.json();
  const { status_url, response_url } = submitData;
  if (!status_url || !response_url) return { data: submitData };

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const statusRes = await fetch(status_url, { headers: falHeaders });
    const statusData = await statusRes.json();
    console.log(`[${endpoint}] Poll ${i + 1}: ${statusData.status}`);
    if (statusData.status === "COMPLETED") {
      const resultRes = await fetch(response_url, { headers: falHeaders });
      return { data: await resultRes.json() };
    }
    if (statusData.status === "FAILED") return { data: null, error: `Generation failed: ${JSON.stringify(statusData)}` };
  }
  return { data: null, error: "Generation timed out" };
}

// ===== UPSCALE WITH CLARITY UPSCALER =====
async function upscaleWithClarity(imageUrl: string, falHeaders: Record<string, string>): Promise<{ url: string; cost: number } | null> {
  console.log("[upscale] Using Clarity Upscaler for 2K/4K pipeline");
  const result = await falQueueRun("fal-ai/clarity-upscaler", {
    image_url: imageUrl,
    scale_factor: 2,
    creativity: 0.35,
    resemblance: 0.6,
    detail: 1.0,
  }, falHeaders);

  if (result.error) {
    console.error("[upscale] Clarity Upscaler failed:", result.error);
    return null;
  }

  const url = result.data?.image?.url;
  if (!url) return null;
  return { url, cost: 0.03 };
}

// ===== MAIN HANDLER =====
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FAL_AI_API_KEY = Deno.env.get("FAL_AI_API_KEY");
    if (!FAL_AI_API_KEY) throw new Error("FAL_AI_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const { prompt, model_endpoint, aspect_ratio, num_images, input_type, quality_tier, model_id, job_id, image_url, image_urls } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let endpoint = model_endpoint || "fal-ai/flux/schnell";
    let modelInputType = input_type || "image_size";
    let resolvedModelId = model_id || null;
    let creditsUsed = 2;
    let dbBaseCost = 0;
    let pricingMode = "flat_per_image";
    let upscaleStrategy = "clarity";
    let editEndpoint: string | null = null;
    let supportsImageInput = false;

    const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : null;

    if (supabase) {
      try {
        let modelQuery = supabase.from("models").select("*");
        if (model_id) modelQuery = modelQuery.eq("id", model_id);
        else if (model_endpoint) modelQuery = modelQuery.eq("endpoint_id", model_endpoint);
        else modelQuery = modelQuery.eq("is_active", true).eq("is_default", true);

        const { data: modelData } = await modelQuery.single();
        if (modelData) {
          endpoint = modelData.endpoint_id;
          modelInputType = modelData.input_type;
          resolvedModelId = modelData.id;
          dbBaseCost = modelData.cost_per_run ? Number(modelData.cost_per_run) : 0;
          creditsUsed = modelData.credits_per_generation || 2;
          pricingMode = modelData.pricing_mode || "flat_per_image";
          upscaleStrategy = modelData.upscale_strategy || "clarity";
          editEndpoint = modelData.edit_endpoint_id || null;
          supportsImageInput = modelData.supports_image_input || false;
        }

        if (resolvedModelId && quality_tier) {
          const { data: tierData } = await supabase
            .from("model_pricing_tiers")
            .select("credits_charged, cost_per_run")
            .eq("model_id", resolvedModelId)
            .eq("quality_level", quality_tier)
            .single();
          if (tierData) creditsUsed = tierData.credits_charged;
        }
      } catch (e) {
        console.log("DB lookup error (non-fatal):", e);
      }
    }

    // Determine if this is an image-to-image request
    const hasImageInput = (!!image_url || (Array.isArray(image_urls) && image_urls.length > 0));
    const isImageToImage = hasImageInput && supportsImageInput && !!editEndpoint;
    const activeEndpoint = isImageToImage ? editEndpoint! : endpoint;

    console.log(`[generate-image] mode=${isImageToImage ? 'image-to-image' : 'text-to-image'} endpoint=${activeEndpoint} ratio=${aspect_ratio || '1:1'} quality=${quality_tier || '1K'} job_id=${job_id || 'none'}`);

    const falHeaders = { Authorization: `Key ${FAL_AI_API_KEY}`, "Content-Type": "application/json" };
    const selectedRatio = aspect_ratio || "1:1";
    const selectedQuality = quality_tier || "1K";

    const actualApiCost = calculateProviderCost(activeEndpoint, selectedRatio, selectedQuality, dbBaseCost, pricingMode);
    const dims = getResolutionDims(selectedRatio, selectedQuality);

    const needsUpscale = (selectedQuality === "2K" || selectedQuality === "4K") && upscaleStrategy === "clarity" && !isImageToImage;
    const generateQuality = needsUpscale ? "1K" : selectedQuality;

    const payloadParams = resolvePayload(activeEndpoint, selectedRatio, generateQuality, modelInputType, isImageToImage ? image_url : undefined, isImageToImage ? image_urls : undefined);
    const payload: Record<string, unknown> = {
      prompt,
      num_images: num_images || 1,
      enable_safety_checker: true,
      ...payloadParams,
    };

    // Flux redux doesn't use prompt — it uses the image as the base
    if (activeEndpoint.includes("/redux")) {
      delete payload.prompt;
      // Redux uses image_url as primary input; prompt becomes optional guidance
      if (prompt && prompt.trim()) {
        // Some redux endpoints don't accept prompt, but we keep it for those that do
      }
    }

    if (activeEndpoint === "fal-ai/flux/schnell") payload.num_inference_steps = 4;

    console.log(`[generate-image] payload keys: ${Object.keys(payload).join(', ')}`);

    // ===== GENERATE =====
    const genResult = await falQueueRun(activeEndpoint, payload, falHeaders);

    if (genResult.error) {
      if (supabase && job_id) {
        await supabase.from("generation_logs").update({ status: "failed" }).eq("id", job_id);
      }
      return new Response(JSON.stringify({ error: genResult.error }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let resultData = genResult.data;
    let upscaleCost = 0;
    let wasUpscaled = false;
    let upscaleModel: string | null = null;
    let finalWidth = dims.width;
    let finalHeight = dims.height;

    // ===== UPSCALE PIPELINE =====
    if (needsUpscale) {
      const generatedUrl = resultData?.images?.[0]?.url;
      if (generatedUrl) {
        let currentUrl = generatedUrl;
        const upscaleSteps = selectedQuality === "4K" ? 2 : 1;
        
        for (let step = 0; step < upscaleSteps; step++) {
          const upscaleResult = await upscaleWithClarity(currentUrl, falHeaders);
          if (upscaleResult) {
            currentUrl = upscaleResult.url;
            upscaleCost += upscaleResult.cost;
            wasUpscaled = true;
            upscaleModel = "fal-ai/clarity-upscaler";
          } else {
            break;
          }
        }

        if (wasUpscaled) {
          resultData = { ...resultData, images: [{ url: currentUrl, ...resultData.images[0] }] };
        }
      }
    }

    // ===== ECONOMICS =====
    const totalCost = actualApiCost + upscaleCost;
    const revenueUsd = creditsUsed * CREDIT_VALUE_USD;
    const profitUsd = revenueUsd - totalCost;
    const marginPct = revenueUsd > 0 ? (profitUsd / revenueUsd) * 100 : 0;

    const imageResultUrl = resultData?.images?.[0]?.url || resultData?.image?.url || null;

    // ===== UPDATE OR INSERT LOG =====
    if (supabase) {
      try {
        const logData = {
          model_id: resolvedModelId,
          prompt: prompt.slice(0, 500),
          ratio: selectedRatio,
          resolution: selectedQuality,
          quality_tier: selectedQuality,
          credits_used: creditsUsed,
          provider_cost: totalCost,
          revenue: revenueUsd,
          margin: profitUsd,
          requested_ratio: selectedRatio,
          requested_quality_tier: selectedQuality,
          actual_api_cost: totalCost,
          generation_cost: actualApiCost,
          upscale_cost: upscaleCost,
          revenue_usd: revenueUsd,
          profit_usd: profitUsd,
          margin_pct: marginPct,
          was_upscaled: wasUpscaled,
          used_upscale_pipeline: wasUpscaled,
          upscale_model: upscaleModel,
          actual_output_width: finalWidth,
          actual_output_height: finalHeight,
          image_url: imageResultUrl,
          status: "completed",
        };

        if (job_id) {
          await supabase.from("generation_logs").update(logData).eq("id", job_id);
        } else {
          await supabase.from("generation_logs").insert(logData);
        }
      } catch (e) {
        console.log("Generation log error (non-fatal):", e);
      }
    }

    console.log(`[generate-image] Complete. job_id=${job_id || 'none'} mode=${isImageToImage ? 'i2i' : 't2i'} genCost=$${actualApiCost.toFixed(4)} total=$${totalCost.toFixed(4)} margin=${marginPct.toFixed(1)}%`);

    // Normalize output: some endpoints return { image: { url } } instead of { images: [{ url }] }
    const normalizedImages = resultData?.images || (resultData?.image ? [resultData.image] : []);

    return new Response(JSON.stringify({
      ...resultData,
      images: normalizedImages,
      model_used: activeEndpoint,
      credits_used: creditsUsed,
      actual_api_cost: totalCost,
      revenue_usd: revenueUsd,
      profit_usd: profitUsd,
      margin_pct: marginPct,
      requested_ratio: selectedRatio,
      requested_quality: selectedQuality,
      was_upscaled: wasUpscaled,
      upscale_model: upscaleModel,
      job_id: job_id || null,
      is_image_to_image: isImageToImage,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("generate-image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
