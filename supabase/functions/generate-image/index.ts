import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Base sizes per ratio at 1K quality (~1MP)
const RATIO_BASE_DIMS: Record<string, { w: number; h: number }> = {
  "1:1":  { w: 1024, h: 1024 },
  "16:9": { w: 1344, h: 768 },
  "9:16": { w: 768, h: 1344 },
  "4:3":  { w: 1184, h: 896 },
  "3:4":  { w: 896, h: 1184 },
  "4:5":  { w: 896, h: 1120 },
  "5:4":  { w: 1120, h: 896 },
  "3:2":  { w: 1216, h: 832 },
  "2:3":  { w: 832, h: 1216 },
  "21:9": { w: 1536, h: 640 },
};

// Quality multipliers relative to 1K base
const QUALITY_MULTIPLIERS: Record<string, number> = {
  "1K": 1,
  "standard": 1,
  "2K": 2,
  "hd": 2,
  "4K": 4,
  "ultra": 4,
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

function parseMaxResolution(maxRes: string | null): { maxW: number; maxH: number } {
  if (!maxRes) return { maxW: 4096, maxH: 4096 };
  const parts = maxRes.toLowerCase().split("x");
  if (parts.length === 2) {
    const w = parseInt(parts[0]); const h = parseInt(parts[1]);
    if (!isNaN(w) && !isNaN(h)) return { maxW: w, maxH: h };
  }
  const single = parseInt(maxRes);
  if (!isNaN(single)) return { maxW: single, maxH: single };
  return { maxW: 4096, maxH: 4096 };
}

function resolveImageSize(ratio: string, qualityTier: string | null, maxRes?: string | null): { width: number; height: number } {
  const base = RATIO_BASE_DIMS[ratio] || RATIO_BASE_DIMS["1:1"];
  const mult = QUALITY_MULTIPLIERS[qualityTier || "1K"] || 1;
  // Round to nearest multiple of 32 (fal.ai requirement)
  let w = Math.round((base.w * mult) / 32) * 32;
  let h = Math.round((base.h * mult) / 32) * 32;
  // Cap to model max resolution
  const { maxW, maxH } = parseMaxResolution(maxRes || null);
  w = Math.min(w, maxW);
  h = Math.min(h, maxH);
  return { width: w, height: h };
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
    let modelMaxRes: string | null = null;

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
          modelMaxRes = modelData.max_resolution || null;
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

    const falHeaders = {
      Authorization: `Key ${FAL_AI_API_KEY}`,
      "Content-Type": "application/json",
    };

    const payload: Record<string, unknown> = {
      prompt,
      num_images: num_images || 1,
      enable_safety_checker: true,
    };

    // ===== RESOLUTION + RATIO MAPPING =====
    const selectedRatio = aspect_ratio || "1:1";

    if (modelInputType === "aspect_ratio") {
      payload.aspect_ratio = selectedRatio;
      if (quality_tier && quality_tier !== "1K" && quality_tier !== "standard") {
        const dims = resolveImageSize(selectedRatio, quality_tier, modelMaxRes);
        payload.image_size = dims;
      }
    } else {
      if (quality_tier && quality_tier !== "1K" && quality_tier !== "standard") {
        const dims = resolveImageSize(selectedRatio, quality_tier, modelMaxRes);
        payload.image_size = dims;
      } else if (image_size) {
        payload.image_size = image_size;
      } else {
        // 1K / standard: use preset strings
        payload.image_size = RATIO_TO_PRESET[selectedRatio] || "square_hd";
      }
    }

    if (endpoint === "fal-ai/flux/schnell") {
      payload.num_inference_steps = 4;
    }

    console.log(`[generate-image] endpoint=${endpoint} ratio=${selectedRatio} quality=${quality_tier} inputType=${modelInputType}`);
    console.log(`[generate-image] payload:`, JSON.stringify(payload));

    const submitRes = await fetch(`https://queue.fal.run/${endpoint}`, {
      method: "POST",
      headers: falHeaders,
      body: JSON.stringify(payload),
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      console.error("fal.ai submit error:", submitRes.status, errorText);
      return new Response(
        JSON.stringify({ error: `fal.ai API error: ${submitRes.status}`, details: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const submitData = await submitRes.json();
    const { status_url, response_url } = submitData;

    if (!status_url || !response_url) {
      return new Response(JSON.stringify(submitData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(status_url, { headers: falHeaders });
      const statusData = await statusRes.json();
      console.log("Poll attempt", i + 1, "status:", statusData.status);

      if (statusData.status === "COMPLETED") {
        const resultRes = await fetch(response_url, { headers: falHeaders });
        const resultData = await resultRes.json();
        console.log("Generation complete, images:", resultData.images?.length);
        return new Response(JSON.stringify({
          ...resultData,
          model_used: endpoint,
          credits_used: creditsUsed,
          provider_cost: providerCost,
          requested_ratio: selectedRatio,
          requested_quality: quality_tier || "1K",
          requested_image_size: payload.image_size,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (statusData.status === "FAILED") {
        console.error("fal.ai generation failed:", statusData);
        return new Response(
          JSON.stringify({ error: "Image generation failed", details: statusData }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Generation timed out" }),
      { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
