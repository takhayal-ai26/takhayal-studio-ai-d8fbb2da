import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ===== CENTRALIZED COST ENGINE (server-side mirror) =====
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

// ===== VERIFIED PRICING =====
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
  "fal-ai/bytedance/seedream/v4.5": { type: "flat_per_image", cost1k: 0.06, cost2k: 0.08, cost4k: 0.12 },
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
  if (type === "size_locked") {
    return verified?.cost1k ?? dbBaseCost;
  }
  // flat_per_image
  if (quality === "4K") return verified?.cost4k ?? dbBaseCost;
  if (quality === "2K") return verified?.cost2k ?? dbBaseCost;
  return verified?.cost1k ?? dbBaseCost;
}

// ===== RESOLUTION PAYLOAD RESOLVERS =====
function resolvePayload(endpoint: string, ratio: string, quality: string, inputType: string): Record<string, unknown> {
  // GPT Image 1.5: strict sizes
  if (endpoint === "fal-ai/gpt-image-1.5") {
    const sizeMap: Record<string, string> = { "1:1": "1024x1024", "2:3": "1024x1536", "3:2": "1536x1024" };
    return { quality: "low", image_size: sizeMap[ratio] || "1024x1024" };
  }
  // Ideogram: quality → rendering_speed
  if (endpoint.includes("ideogram")) {
    const speedMap: Record<string, string> = { "1K": "TURBO", "2K": "BALANCED", "4K": "QUALITY" };
    return { aspect_ratio: ratio, rendering_speed: speedMap[quality] || "TURBO" };
  }
  // Nano Banana models: use resolution parameter
  if (endpoint.includes("nano-banana")) {
    const resMap: Record<string, string> = { "1K": "1024", "2K": "2048", "4K": "4096" };
    return { aspect_ratio: ratio, resolution: resMap[quality] || "1024" };
  }
  // Imagen 4: aspect_ratio + resolution param
  if (endpoint.includes("imagen4")) {
    const resMap: Record<string, string> = { "1K": "1024", "2K": "2048" };
    return { aspect_ratio: ratio, resolution: resMap[quality] || "1024" };
  }
  // Seedream: image_size with computed dimensions
  if (endpoint.includes("seedream")) {
    const dims = getResolutionDims(ratio, quality);
    return { image_size: { width: dims.width, height: dims.height } };
  }
  // aspect_ratio models
  if (inputType === "aspect_ratio") {
    return { aspect_ratio: ratio };
  }
  // image_size models (Flux, Qwen, etc.) — native resolution
  const dims = getResolutionDims(ratio, quality);
  return { image_size: { width: dims.width, height: dims.height } };
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

// ===== MAIN HANDLER =====
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FAL_AI_API_KEY = Deno.env.get("FAL_AI_API_KEY");
    if (!FAL_AI_API_KEY) throw new Error("FAL_AI_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const { prompt, model_endpoint, aspect_ratio, num_images, input_type, quality_tier, model_id } = await req.json();

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

    // Fetch model config from DB
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
        }

        // Check for quality-tier-specific credits from model_pricing_tiers
        if (resolvedModelId && quality_tier) {
          const { data: tierData } = await supabase
            .from("model_pricing_tiers")
            .select("credits_charged, cost_per_run")
            .eq("model_id", resolvedModelId)
            .eq("quality_level", quality_tier)
            .single();
          if (tierData) {
            creditsUsed = tierData.credits_charged;
            // Don't override cost from tiers — use centralized calculation instead
          }
        }
      } catch (e) {
        console.log("DB lookup error (non-fatal):", e);
      }
    }

    const falHeaders = { Authorization: `Key ${FAL_AI_API_KEY}`, "Content-Type": "application/json" };
    const selectedRatio = aspect_ratio || "1:1";
    const selectedQuality = quality_tier || "1K";

    // ===== CALCULATE REAL COST =====
    const actualApiCost = calculateProviderCost(endpoint, selectedRatio, selectedQuality, dbBaseCost, pricingMode);
    const dims = getResolutionDims(selectedRatio, selectedQuality);

    // ===== BUILD PAYLOAD =====
    const payloadParams = resolvePayload(endpoint, selectedRatio, selectedQuality, modelInputType);
    const payload: Record<string, unknown> = {
      prompt,
      num_images: num_images || 1,
      enable_safety_checker: true,
      ...payloadParams,
    };

    if (endpoint === "fal-ai/flux/schnell") payload.num_inference_steps = 4;

    console.log(`[generate-image] endpoint=${endpoint} ratio=${selectedRatio} quality=${selectedQuality} cost=$${actualApiCost.toFixed(4)}`);
    console.log(`[generate-image] payload:`, JSON.stringify(payload));

    // ===== GENERATE =====
    const genResult = await falQueueRun(endpoint, payload, falHeaders);

    if (genResult.error) {
      return new Response(JSON.stringify({ error: genResult.error }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const resultData = genResult.data;

    // ===== ECONOMICS =====
    const revenueUsd = creditsUsed * CREDIT_VALUE_USD;
    const profitUsd = revenueUsd - actualApiCost;
    const marginPct = revenueUsd > 0 ? (profitUsd / revenueUsd) * 100 : 0;

    // ===== LOG GENERATION =====
    if (supabase) {
      try {
        await supabase.from("generation_logs").insert({
          model_id: resolvedModelId,
          prompt: prompt.slice(0, 500),
          ratio: selectedRatio,
          resolution: selectedQuality,
          quality_tier: selectedQuality,
          credits_used: creditsUsed,
          provider_cost: actualApiCost,
          revenue: revenueUsd,
          margin: profitUsd,
          requested_ratio: selectedRatio,
          requested_quality_tier: selectedQuality,
          actual_api_cost: actualApiCost,
          generation_cost: actualApiCost,
          upscale_cost: 0,
          revenue_usd: revenueUsd,
          profit_usd: profitUsd,
          margin_pct: marginPct,
          was_upscaled: false,
          used_upscale_pipeline: false,
          upscale_model: null,
          actual_output_width: dims.width,
          actual_output_height: dims.height,
        });
      } catch (e) {
        console.log("Generation log error (non-fatal):", e);
      }
    }

    console.log(`[generate-image] Complete. cost=$${actualApiCost.toFixed(4)} revenue=$${revenueUsd.toFixed(4)} margin=${marginPct.toFixed(1)}%`);

    return new Response(JSON.stringify({
      ...resultData,
      model_used: endpoint,
      credits_used: creditsUsed,
      actual_api_cost: actualApiCost,
      revenue_usd: revenueUsd,
      profit_usd: profitUsd,
      margin_pct: marginPct,
      requested_ratio: selectedRatio,
      requested_quality: selectedQuality,
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
