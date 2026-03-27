import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATIO_BASE_DIMS: Record<string, { w: number; h: number }> = {
  "1:1": { w: 1024, h: 1024 }, "16:9": { w: 1344, h: 768 }, "9:16": { w: 768, h: 1344 },
  "4:3": { w: 1184, h: 896 }, "3:4": { w: 896, h: 1184 }, "4:5": { w: 896, h: 1120 },
  "5:4": { w: 1120, h: 896 }, "3:2": { w: 1216, h: 832 }, "2:3": { w: 832, h: 1216 },
  "21:9": { w: 1536, h: 640 },
};

const RATIO_TO_PRESET: Record<string, string> = {
  "1:1": "square_hd", "16:9": "landscape_16_9", "9:16": "portrait_16_9",
  "4:3": "landscape_4_3", "3:4": "portrait_4_3", "4:5": "portrait_4_3",
  "5:4": "landscape_4_3", "3:2": "landscape_4_3", "2:3": "portrait_4_3",
};

const UPSCALE_FACTORS: Record<string, number> = { "2K": 2, "4K": 4 };
const UPSCALE_COSTS: Record<string, number> = { "2K": 0.003, "4K": 0.006 };

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

async function upscaleImage(imageUrl: string, scale: number, falHeaders: Record<string, string>): Promise<{ url: string | null; error?: string }> {
  console.log(`[upscale] Starting ESRGAN upscale, scale=${scale}`);
  const result = await falQueueRun("fal-ai/esrgan", { image_url: imageUrl, scale }, falHeaders);
  if (result.error) return { url: null, error: result.error };
  const upscaledUrl = result.data?.image?.url;
  if (!upscaledUrl) {
    console.error("[upscale] No image URL in ESRGAN response:", JSON.stringify(result.data));
    return { url: null, error: "ESRGAN returned no image" };
  }
  console.log(`[upscale] Done. Output URL: ${upscaledUrl}`);
  return { url: upscaledUrl };
}

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
    let generationCost = 0;
    let upscaleStrategy = "esrgan";
    const isGptImage = false;

    // Fetch model config from DB
    const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : null;

    if (supabase) {
      try {
        let modelQuery = supabase.from("models").select("*").eq("is_active", true);
        if (model_id) {
          modelQuery = supabase.from("models").select("*").eq("id", model_id);
        } else if (!model_endpoint) {
          modelQuery = modelQuery.eq("is_default", true);
        }

        const { data: modelData } = await modelQuery.single();
        if (modelData) {
          endpoint = modelData.endpoint_id;
          modelInputType = modelData.input_type;
          resolvedModelId = modelData.id;
          generationCost = modelData.cost_per_run ? Number(modelData.cost_per_run) : 0;
          creditsUsed = modelData.credits_per_generation || 2;
          upscaleStrategy = modelData.upscale_strategy || "esrgan";
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
            // cost_per_run in tier = combined cost (generation + upscale)
            // We need to extract just the generation cost from the model's base cost
            generationCost = modelData?.cost_per_run ? Number(modelData.cost_per_run) : Number(tierData.cost_per_run);
          }
        }
      } catch (e) {
        console.log("DB lookup error (non-fatal):", e);
      }
    }

    const falHeaders = { Authorization: `Key ${FAL_AI_API_KEY}`, "Content-Type": "application/json" };

    // ===== BUILD GENERATION PAYLOAD =====
    const selectedRatio = aspect_ratio || "1:1";
    const needsUpscale = quality_tier && UPSCALE_FACTORS[quality_tier];
    const isGptImageModel = endpoint === "fal-ai/gpt-image-1.5";

    const payload: Record<string, unknown> = {
      prompt, num_images: num_images || 1, enable_safety_checker: true,
    };

    // GPT Image 1.5: ALWAYS force low quality and 1024x1024
    if (isGptImageModel) {
      payload.quality = "low";
      payload.image_size = "1024x1024";
      console.log("[generate-image] GPT Image 1.5: forced quality=low, size=1024x1024");
    } else if (modelInputType === "aspect_ratio") {
      payload.aspect_ratio = selectedRatio;
    } else {
      if (image_size && !needsUpscale) {
        payload.image_size = image_size;
      } else {
        payload.image_size = RATIO_TO_PRESET[selectedRatio] || "square_hd";
      }
    }

    if (endpoint === "fal-ai/flux/schnell") payload.num_inference_steps = 4;

    console.log(`[generate-image] endpoint=${endpoint} ratio=${selectedRatio} quality=${quality_tier} needsUpscale=${!!needsUpscale}`);
    console.log(`[generate-image] payload:`, JSON.stringify(payload));

    // ===== STEP 1: Generate at 1K =====
    const genResult = await falQueueRun(endpoint, payload, falHeaders);

    if (genResult.error) {
      return new Response(JSON.stringify({ error: genResult.error }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let resultData = genResult.data;
    let upscaled = false;
    let upscaleCost = 0;

    // ===== STEP 2: Upscale if 2K or 4K =====
    if (needsUpscale && resultData?.images?.length > 0) {
      const scale = UPSCALE_FACTORS[quality_tier!];
      upscaleCost = UPSCALE_COSTS[quality_tier!] || 0;
      const upscaledImages = [];

      for (const img of resultData.images) {
        const originalUrl = img.url;
        const upResult = await upscaleImage(originalUrl, scale, falHeaders);
        if (upResult.url) {
          upscaledImages.push({ ...img, url: upResult.url, original_url: originalUrl });
          upscaled = true;
        } else {
          console.warn("[upscale] Failed, keeping original:", upResult.error);
          upscaledImages.push(img);
          upscaleCost = 0; // Don't charge for failed upscale
        }
      }
      resultData = { ...resultData, images: upscaledImages };
    }

    // ===== Calculate full economics =====
    const actualApiCost = generationCost + upscaleCost;
    const creditValueUsd = 0.016; // 1 credit = $0.016
    const revenueUsd = creditsUsed * creditValueUsd;
    const profitUsd = revenueUsd - actualApiCost;
    const marginPct = revenueUsd > 0 ? (profitUsd / revenueUsd) * 100 : 0;
    const baseDims = RATIO_BASE_DIMS[selectedRatio] || { w: 1024, h: 1024 };

    // ===== Log generation with full cost breakdown =====
    if (supabase) {
      try {
        await supabase.from("generation_logs").insert({
          model_id: resolvedModelId,
          prompt: prompt.slice(0, 500),
          ratio: selectedRatio,
          resolution: quality_tier || "1K",
          quality_tier: quality_tier || "1K",
          credits_used: creditsUsed,
          provider_cost: actualApiCost,
          revenue: revenueUsd,
          margin: profitUsd,
          requested_ratio: selectedRatio,
          requested_quality_tier: quality_tier || "1K",
          used_upscale_pipeline: upscaled,
          actual_output_width: needsUpscale ? baseDims.w * UPSCALE_FACTORS[quality_tier!] : baseDims.w,
          actual_output_height: needsUpscale ? baseDims.h * UPSCALE_FACTORS[quality_tier!] : baseDims.h,
          // New detailed cost fields
          generation_cost: generationCost,
          upscale_cost: upscaleCost,
          actual_api_cost: actualApiCost,
          revenue_usd: revenueUsd,
          profit_usd: profitUsd,
          margin_pct: marginPct,
          was_upscaled: upscaled,
          upscale_model: upscaled ? "fal-ai/esrgan" : null,
        });
      } catch (e) {
        console.log("Generation log error (non-fatal):", e);
      }
    }

    console.log(`[generate-image] Complete. images=${resultData?.images?.length} upscaled=${upscaled} genCost=$${generationCost} upscaleCost=$${upscaleCost} total=$${actualApiCost} revenue=$${revenueUsd} margin=${marginPct.toFixed(1)}%`);

    return new Response(JSON.stringify({
      ...resultData,
      model_used: endpoint,
      credits_used: creditsUsed,
      generation_cost: generationCost,
      upscale_cost: upscaleCost,
      actual_api_cost: actualApiCost,
      revenue_usd: revenueUsd,
      profit_usd: profitUsd,
      margin_pct: marginPct,
      requested_ratio: selectedRatio,
      requested_quality: quality_tier || "1K",
      upscaled,
      upscale_strategy: upscaled ? upscaleStrategy : null,
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
