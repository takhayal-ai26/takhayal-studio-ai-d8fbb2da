import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ===== NATIVE RESOLUTION SYSTEM =====
// Each model resolves its own dimensions — NO upscaling pipeline

interface ResolutionResult {
  payload: Record<string, unknown>;
  estimatedCost: number;
}

// Model-specific resolution resolvers
function resolveFluxResolution(ratio: string, quality: string, baseCostPerMP: number): ResolutionResult {
  // Flux/Qwen: per-megapixel pricing, native resolution support
  const baseMap: Record<string, { w: number; h: number }> = {
    "1:1": { w: 1024, h: 1024 }, "16:9": { w: 1344, h: 768 }, "9:16": { w: 768, h: 1344 },
    "4:3": { w: 1184, h: 896 }, "3:4": { w: 896, h: 1184 }, "4:5": { w: 896, h: 1120 },
    "5:4": { w: 1120, h: 896 }, "3:2": { w: 1216, h: 832 }, "2:3": { w: 832, h: 1216 },
    "21:9": { w: 1536, h: 640 },
  };
  const base = baseMap[ratio] || { w: 1024, h: 1024 };
  const scale = quality === "4K" ? 4 : quality === "2K" ? 2 : 1;
  const w = base.w * scale;
  const h = base.h * scale;
  const mp = (w * h) / 1_000_000;
  return {
    payload: { image_size: { width: w, height: h } },
    estimatedCost: mp * baseCostPerMP,
  };
}

function resolveGptImageResolution(ratio: string): ResolutionResult {
  // GPT Image 1.5: strict sizes, forced low quality
  const sizeMap: Record<string, { size: string; cost: number }> = {
    "1:1": { size: "1024x1024", cost: 0.011 },
    "2:3": { size: "1024x1536", cost: 0.016 },
    "3:2": { size: "1536x1024", cost: 0.016 },
  };
  const entry = sizeMap[ratio] || sizeMap["1:1"];
  return {
    payload: { quality: "low", image_size: entry.size },
    estimatedCost: entry.cost,
  };
}

function resolveIdeogramResolution(ratio: string, quality: string): ResolutionResult {
  // Ideogram V3: quality maps to rendering_speed
  const costMap: Record<string, { speed: string; cost: number }> = {
    "1K": { speed: "TURBO", cost: 0.03 },
    "2K": { speed: "BALANCED", cost: 0.06 },
    "4K": { speed: "QUALITY", cost: 0.09 },
  };
  const entry = costMap[quality] || costMap["1K"];
  return {
    payload: { aspect_ratio: ratio, rendering_speed: entry.speed },
    estimatedCost: entry.cost,
  };
}

function resolveAspectRatioModel(ratio: string, quality: string, baseCost: number): ResolutionResult {
  // Models that accept aspect_ratio param (Recraft, etc.)
  const scale = quality === "4K" ? 3 : quality === "2K" ? 2 : 1;
  return {
    payload: { aspect_ratio: ratio },
    estimatedCost: baseCost * scale,
  };
}

function resolveDefaultResolution(ratio: string, quality: string, inputType: string, baseCost: number): ResolutionResult {
  // Default: image_size models with standard resolution scaling
  const baseMap: Record<string, { w: number; h: number }> = {
    "1:1": { w: 1024, h: 1024 }, "16:9": { w: 1344, h: 768 }, "9:16": { w: 768, h: 1344 },
    "4:3": { w: 1184, h: 896 }, "3:4": { w: 896, h: 1184 }, "4:5": { w: 896, h: 1120 },
    "5:4": { w: 1120, h: 896 }, "3:2": { w: 1216, h: 832 }, "2:3": { w: 832, h: 1216 },
    "21:9": { w: 1536, h: 640 },
  };
  const base = baseMap[ratio] || { w: 1024, h: 1024 };
  const scale = quality === "4K" ? 4 : quality === "2K" ? 2 : 1;

  if (inputType === "aspect_ratio") {
    return { payload: { aspect_ratio: ratio }, estimatedCost: baseCost * scale };
  }

  return {
    payload: { image_size: { width: base.w * scale, height: base.h * scale } },
    estimatedCost: baseCost * scale,
  };
}

// Main resolution resolver — routes by model endpoint
function resolveModelResolution(
  endpoint: string,
  ratio: string,
  quality: string,
  inputType: string,
  baseCost: number
): ResolutionResult {
  // GPT Image 1.5
  if (endpoint === "fal-ai/gpt-image-1.5") {
    return resolveGptImageResolution(ratio);
  }
  // Ideogram
  if (endpoint.includes("ideogram")) {
    return resolveIdeogramResolution(ratio, quality);
  }
  // Flux family (per-megapixel)
  if (endpoint.includes("flux")) {
    return resolveFluxResolution(ratio, quality, baseCost > 0 ? baseCost : 0.003);
  }
  // Recraft
  if (endpoint.includes("recraft")) {
    return resolveAspectRatioModel(ratio, quality, baseCost > 0 ? baseCost : 0.04);
  }
  // Default
  return resolveDefaultResolution(ratio, quality, inputType, baseCost > 0 ? baseCost : 0.003);
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

    const { prompt, model_endpoint, aspect_ratio, image_size, num_images, input_type, quality_tier, model_id } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let endpoint = model_endpoint || "fal-ai/flux/schnell";
    let modelInputType = input_type || "image_size";
    let resolvedModelId = model_id || null;
    let creditsUsed = 2;
    let baseCostPerRun = 0;

    // Fetch model config from DB
    const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : null;

    if (supabase) {
      try {
        let modelQuery = supabase.from("models").select("*");
        if (model_id) {
          modelQuery = modelQuery.eq("id", model_id);
        } else if (model_endpoint) {
          modelQuery = modelQuery.eq("endpoint_id", model_endpoint);
        } else {
          modelQuery = modelQuery.eq("is_active", true).eq("is_default", true);
        }

        const { data: modelData } = await modelQuery.single();
        if (modelData) {
          endpoint = modelData.endpoint_id;
          modelInputType = modelData.input_type;
          resolvedModelId = modelData.id;
          baseCostPerRun = modelData.cost_per_run ? Number(modelData.cost_per_run) : 0;
          creditsUsed = modelData.credits_per_generation || 2;
        }

        // Check for quality-tier-specific pricing
        if (resolvedModelId && quality_tier) {
          const { data: tierData } = await supabase
            .from("model_pricing_tiers")
            .select("credits_charged, cost_per_run")
            .eq("model_id", resolvedModelId)
            .eq("quality_level", quality_tier)
            .single();
          if (tierData) {
            creditsUsed = tierData.credits_charged;
            baseCostPerRun = Number(tierData.cost_per_run) || baseCostPerRun;
          }
        }
      } catch (e) {
        console.log("DB lookup error (non-fatal):", e);
      }
    }

    const falHeaders = { Authorization: `Key ${FAL_AI_API_KEY}`, "Content-Type": "application/json" };
    const selectedRatio = aspect_ratio || "1:1";
    const selectedQuality = quality_tier || "1K";

    // ===== RESOLVE NATIVE RESOLUTION =====
    const resolution = resolveModelResolution(endpoint, selectedRatio, selectedQuality, modelInputType, baseCostPerRun);
    const actualApiCost = resolution.estimatedCost;

    // Build payload
    const payload: Record<string, unknown> = {
      prompt,
      num_images: num_images || 1,
      enable_safety_checker: true,
      ...resolution.payload,
    };

    if (endpoint === "fal-ai/flux/schnell") payload.num_inference_steps = 4;

    console.log(`[generate-image] endpoint=${endpoint} ratio=${selectedRatio} quality=${selectedQuality}`);
    console.log(`[generate-image] payload:`, JSON.stringify(payload));

    // ===== GENERATE (single step, no upscale) =====
    const genResult = await falQueueRun(endpoint, payload, falHeaders);

    if (genResult.error) {
      return new Response(JSON.stringify({ error: genResult.error }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const resultData = genResult.data;

    // ===== ECONOMICS =====
    const creditValueUsd = 0.016;
    const revenueUsd = creditsUsed * creditValueUsd;
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
          used_upscale_pipeline: false,
          actual_api_cost: actualApiCost,
          generation_cost: actualApiCost,
          upscale_cost: 0,
          revenue_usd: revenueUsd,
          profit_usd: profitUsd,
          margin_pct: marginPct,
          was_upscaled: false,
          upscale_model: null,
        });
      } catch (e) {
        console.log("Generation log error (non-fatal):", e);
      }
    }

    console.log(`[generate-image] Complete. images=${resultData?.images?.length} cost=$${actualApiCost.toFixed(4)} revenue=$${revenueUsd.toFixed(4)} margin=${marginPct.toFixed(1)}%`);

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
      upscaled: false,
      upscale_strategy: null,
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
