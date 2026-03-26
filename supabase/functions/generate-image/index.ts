import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// fal.ai preset strings for models that use image_size presets
const RATIO_TO_PRESET: Record<string, string> = {
  "1:1": "square_hd",
  "16:9": "landscape_16_9",
  "9:16": "portrait_16_9",
  "4:3": "landscape_4_3",
  "3:4": "portrait_4_3",
  "4:5": "portrait_4_3",
  "5:4": "landscape_4_3",
  "3:2": "landscape_4_3",
  "2:3": "portrait_4_3",
};

// Upscale multipliers: 2K = 2x, 4K = 4x
const UPSCALE_FACTORS: Record<string, number> = {
  "2K": 2,
  "hd": 2,
  "4K": 4,
  "ultra": 4,
};

// Additional provider cost for upscaling (ESRGAN)
const UPSCALE_COSTS: Record<string, number> = {
  "2K": 0.001,
  "hd": 0.001,
  "4K": 0.003,
  "ultra": 0.003,
};

// Models with restricted image_size literals
const RESTRICTED_SIZE_MODELS: Record<string, Record<string, string>> = {
  "fal-ai/gpt-image-1.5": {
    "1:1": "1024x1024",
    "16:9": "1536x1024",
    "9:16": "1024x1536",
    "4:3": "1536x1024",
    "3:4": "1024x1536",
  },
};

/**
 * Submit a fal.ai queue job, poll until complete, return result JSON.
 */
async function falQueueRun(endpoint: string, payload: Record<string, unknown>, apiKey: string): Promise<any> {
  const falHeaders = {
    Authorization: `Key ${apiKey}`,
    "Content-Type": "application/json",
  };

  const submitRes = await fetch(`https://queue.fal.run/${endpoint}`, {
    method: "POST",
    headers: falHeaders,
    body: JSON.stringify(payload),
  });

  if (!submitRes.ok) {
    const errorText = await submitRes.text();
    throw new Error(`fal.ai API error ${submitRes.status}: ${errorText}`);
  }

  const submitData = await submitRes.json();
  const { status_url, response_url } = submitData;

  // If no queue URLs, it returned the result directly
  if (!status_url || !response_url) return submitData;

  // Poll for completion
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const statusRes = await fetch(status_url, { headers: falHeaders });
    const statusData = await statusRes.json();
    console.log(`Poll ${endpoint} attempt ${i + 1}: ${statusData.status}`);

    if (statusData.status === "COMPLETED") {
      const resultRes = await fetch(response_url, { headers: falHeaders });
      return await resultRes.json();
    }
    if (statusData.status === "FAILED") {
      throw new Error(`fal.ai generation failed: ${JSON.stringify(statusData)}`);
    }
  }
  throw new Error("Generation timed out after 120s");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_AI_API_KEY = Deno.env.get("FAL_AI_API_KEY");
    if (!FAL_AI_API_KEY) throw new Error("FAL_AI_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const { prompt, model_endpoint, aspect_ratio, image_size, num_images, input_type, quality_tier, model_id } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let endpoint = model_endpoint || "fal-ai/flux/schnell";
    let modelInputType = input_type || "image_size";
    let resolvedModelId = model_id || null;
    let creditsUsed = 2;
    let providerCost = 0;

    // Fetch model config from DB
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
          providerCost = modelData.cost_per_run ? Number(modelData.cost_per_run) : 0;
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
            providerCost = Number(tierData.cost_per_run);
          }
        }

        // Fetch credit settings for revenue calculation
        const { data: creditSettings } = await supabase
          .from("credit_settings")
          .select("credit_value_usd")
          .limit(1)
          .single();

        const creditValueUsd = creditSettings?.credit_value_usd ? Number(creditSettings.credit_value_usd) : 0.02;
        const revenue = creditsUsed * creditValueUsd;
        const margin = revenue - providerCost;

        // Log generation (fire and forget)
        supabase.from("generation_logs").insert({
          model_id: resolvedModelId,
          prompt: prompt.slice(0, 500),
          ratio: aspect_ratio || null,
          resolution: quality_tier || null,
          quality_tier: quality_tier || null,
          credits_used: creditsUsed,
          provider_cost: providerCost,
          revenue,
          margin,
        }).then(() => {});
      } catch (e) {
        console.log("DB lookup error (non-fatal):", e);
      }
    }

    // ===== BUILD GENERATION PAYLOAD =====
    const selectedRatio = aspect_ratio || "1:1";
    const payload: Record<string, unknown> = {
      prompt,
      num_images: num_images || 1,
      enable_safety_checker: true,
    };

    // Always generate at 1K base resolution — upscaling handles 2K/4K
    const restrictedSizes = RESTRICTED_SIZE_MODELS[endpoint];
    if (restrictedSizes) {
      payload.image_size = restrictedSizes[selectedRatio] || restrictedSizes["1:1"] || "1024x1024";
    } else if (modelInputType === "aspect_ratio") {
      payload.aspect_ratio = selectedRatio;
    } else {
      if (image_size) {
        payload.image_size = image_size;
      } else {
        payload.image_size = RATIO_TO_PRESET[selectedRatio] || "square_hd";
      }
    }

    if (endpoint === "fal-ai/flux/schnell") {
      payload.num_inference_steps = 4;
    }

    console.log(`[generate-image] endpoint=${endpoint} ratio=${selectedRatio} quality=${quality_tier} inputType=${modelInputType}`);
    console.log(`[generate-image] payload:`, JSON.stringify(payload));

    // ===== STEP 1: GENERATE IMAGE AT 1K =====
    const resultData = await falQueueRun(endpoint, payload, FAL_AI_API_KEY);
    console.log("Step 1 complete: generated", resultData.images?.length, "images at 1K");

    let finalImages = resultData.images || [];
    let wasUpscaled = false;
    const upscaleFactor = UPSCALE_FACTORS[quality_tier || ""] || 0;

    // ===== STEP 2: UPSCALE IF 2K OR 4K =====
    if (upscaleFactor > 1 && finalImages.length > 0) {
      console.log(`[generate-image] Upscaling ${finalImages.length} image(s) ${upscaleFactor}x via ESRGAN`);
      const upscaledImages = [];

      for (const img of finalImages) {
        try {
          const upscalePayload: Record<string, unknown> = {
            image_url: img.url,
            scale: upscaleFactor,
          };

          const upscaleResult = await falQueueRun("fal-ai/esrgan", upscalePayload, FAL_AI_API_KEY);
          
          if (upscaleResult.image?.url) {
            upscaledImages.push({
              ...img,
              url: upscaleResult.image.url,
              width: upscaleResult.image.width || (img.width ? img.width * upscaleFactor : undefined),
              height: upscaleResult.image.height || (img.height ? img.height * upscaleFactor : undefined),
            });
            wasUpscaled = true;
            console.log(`[generate-image] Upscaled to ${upscaleResult.image.width}x${upscaleResult.image.height}`);
          } else {
            // Fallback: keep original if upscale fails
            upscaledImages.push(img);
            console.warn("[generate-image] Upscale returned no image, keeping original");
          }
        } catch (upscaleErr) {
          console.error("[generate-image] Upscale error (keeping original):", upscaleErr);
          upscaledImages.push(img);
        }
      }

      finalImages = upscaledImages;
    }

    // ===== RETURN RESULT =====
    return new Response(JSON.stringify({
      ...resultData,
      images: finalImages,
      model_used: endpoint,
      credits_used: creditsUsed,
      provider_cost: providerCost,
      requested_ratio: selectedRatio,
      requested_quality: quality_tier || "1K",
      requested_image_size: payload.image_size,
      upscaled: wasUpscaled,
      upscale_factor: upscaleFactor > 1 ? upscaleFactor : null,
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
