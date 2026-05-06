import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import {
  getFalImageResultUrl,
  pollFalQueueUntilDone,
  runFalQueue,
  submitFalQueue,
  submitFalQueueWebhook,
} from "../_shared/fal.ts";
import {
  GenerationJobError,
  type GenerationJobRow,
  assertUsableGenerationJob,
  deductCredits,
  loadGenerationJob,
  makeCreditRefunder,
  markJobCompleted,
  markJobFailed,
  markJobGenerating,
} from "../_shared/jobs.ts";
import {
  CREDIT_VALUE_USD,
  calculateProviderCost,
  getResolutionDims,
  isGptImage2Endpoint,
  normalizeGptImage2Endpoint,
  resolvePayload,
} from "./helpers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Slow endpoints (GPT Image 2) where inference can exceed Supabase edge function wall-clock.
// For these, we return the queued response immediately and finish the work in the background
// via EdgeRuntime.waitUntil (so the row is updated when fal completes, even after the HTTP
// response is closed).
const SLOW_ENDPOINTS = new Set<string>([
  "fal-ai/gpt-image-2",
  "openai/gpt-image-2/edit",
]);

function deferTask(task: () => Promise<unknown>) {
  const edgeRuntime = (globalThis as any).EdgeRuntime;
  const deferred = (async () => {
    await Promise.resolve();
    await task();
  })();

  if (edgeRuntime?.waitUntil) {
    edgeRuntime.waitUntil(deferred);
  } else {
    deferred.catch((error) => console.error("[deferred] task failed:", error));
  }
}

// ===== UPSCALE WITH CLARITY UPSCALER =====
async function upscaleWithClarity(imageUrl: string, falHeaders: Record<string, string>): Promise<{ url: string; cost: number } | null> {
  console.log("[upscale] Using Clarity Upscaler for 2K/4K pipeline");
  const result = await runFalQueue("fal-ai/clarity-upscaler", {
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

  const resultData = result.data as { image?: { url?: string } } | null;
  const url = resultData?.image?.url;
  if (!url) return null;
  return { url, cost: 0.03 };
}

// ===== MAIN HANDLER =====
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const creditRefunder = makeCreditRefunder();

  try {
    const FAL_AI_API_KEY = Deno.env.get("FAL_AI_API_KEY");
    if (!FAL_AI_API_KEY) throw new Error("FAL_AI_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!authHeader || !supabaseAnonKey) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { prompt, model_endpoint, aspect_ratio, num_images, input_type, quality_tier, model_id, job_id, image_url, image_urls } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return jsonResponse({ error: "prompt is required" }, 400);
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

    // Determine if this is an image-to-image request
    // Normalize incoming image URLs and drop any blob:/data: leftovers (only real provider-accessible URLs)
    const rawUrls: string[] = Array.isArray(image_urls)
      ? image_urls.filter((u: unknown) => typeof u === 'string' && /^https?:\/\//i.test(u as string)) as string[]
      : [];
    const singleInUrl: string | undefined = (typeof image_url === 'string' && /^https?:\/\//i.test(image_url)) ? image_url : undefined;
    const allInputUrls: string[] = rawUrls.length > 0 ? rawUrls : (singleInUrl ? [singleInUrl] : []);
    const hasImageInput = allInputUrls.length > 0;

    // Hard block silent fallback: if user sent refs but model doesn't support them, fail loudly.
    if (hasImageInput && !supportsImageInput) {
      const message = "The selected model does not support reference images. Please choose a different model or remove the uploaded images.";
      if (job_id) await supabase.from("generation_logs").update({ status: "failed", error_message: message }).eq("id", job_id);
      return jsonResponse({ error: message }, 400);
    }

    // Route: prefer edit_endpoint when ref images are provided; fallback to main endpoint for models where same endpoint handles both (Nano Banana, GPT Image).
    const isImageToImage = hasImageInput && supportsImageInput;
    const activeEndpoint = normalizeGptImage2Endpoint(isImageToImage ? (editEndpoint || endpoint) : endpoint);

    console.log(`[generate-image] mode=${isImageToImage ? 'image-to-image' : 'text-to-image'} endpoint=${activeEndpoint} refs=${allInputUrls.length} ratio=${aspect_ratio || '1:1'} quality=${quality_tier || '1K'} job_id=${job_id || 'none'}`);

    const falHeaders = { Authorization: `Key ${FAL_AI_API_KEY}`, "Content-Type": "application/json" };
    const selectedRatio = aspect_ratio || "1:1";
    const selectedQuality = quality_tier || "1K";

    const actualApiCost = calculateProviderCost(activeEndpoint, selectedRatio, selectedQuality, dbBaseCost, pricingMode);
    const dims = getResolutionDims(selectedRatio, selectedQuality);

    let existingJob: GenerationJobRow | null = null;
    if (job_id) {
      existingJob = await loadGenerationJob(supabase, job_id);
      try {
        assertUsableGenerationJob(existingJob, user.id);
      } catch (error) {
        if (error instanceof GenerationJobError) {
          return jsonResponse({ error: error.message }, error.status);
        }
        throw error;
      }
    }

    if (!existingJob?.credits_charged_at) {
      const deductData = await deductCredits(supabase, {
        userId: user.id,
        amount: creditsUsed,
        modelId: resolvedModelId,
        resolution: selectedQuality,
      });

      if (!deductData?.success) {
        await markJobFailed(supabase, job_id, deductData?.error || "Credit deduction failed");
        return jsonResponse({ error: deductData?.error || "Credit deduction failed" }, 400);
      }

      creditRefunder.trackCharge(user.id, creditsUsed);

      if (job_id) {
        await supabase.from("generation_logs").update({
          credits_charged_at: new Date().toISOString(),
          credits_used: creditsUsed,
        }).eq("id", job_id);
      }
    }

    // Skip clarity upscale for image-to-image (it would lose the subject). Also skip when endpoint natively supports the requested tier.
    const needsUpscale = (selectedQuality === "2K" || selectedQuality === "4K") && upscaleStrategy === "clarity" && !isImageToImage;
    const generateQuality = needsUpscale ? "1K" : selectedQuality;

    const payloadParams = resolvePayload({
      endpoint: activeEndpoint,
      ratio: selectedRatio,
      quality: generateQuality,
      inputType: modelInputType,
      imageUrls: isImageToImage ? allInputUrls : [],
    });
    const payload: Record<string, unknown> = {
      prompt,
      num_images: num_images || 1,
      ...payloadParams,
    };

    if (!isGptImage2Endpoint(activeEndpoint)) {
      payload.enable_safety_checker = true;
    } else {
      payload.output_format = "png";
    }

    // Flux redux doesn't use prompt — it uses the image as the base
    if (activeEndpoint.includes("/redux")) {
      delete payload.prompt;
    }

    if (activeEndpoint === "fal-ai/flux/schnell") payload.num_inference_steps = 4;

    console.log(`[generate-image] payload keys: ${Object.keys(payload).join(', ')} | has_image_url=${!!payload.image_url} has_image_urls=${Array.isArray(payload.image_urls) ? (payload.image_urls as unknown[]).length : 0}`);

    // Helper that runs after fal returns: handle upscale, write economics, update the job row.
    const finalizeJob = async (genResult: { data: any; error?: string }) => {
      if (genResult.error) {
        await creditRefunder.refund(supabase);
        await markJobFailed(supabase, job_id, genResult.error);
        return { ok: false as const, error: genResult.error };
      }

      let resultData = genResult.data;
      let upscaleCost = 0;
      let wasUpscaled = false;
      let upscaleModel: string | null = null;
      const finalWidth = dims.width;
      const finalHeight = dims.height;

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

      const totalCost = actualApiCost + upscaleCost;
      const revenueUsd = creditsUsed * CREDIT_VALUE_USD;
      const profitUsd = revenueUsd - totalCost;
      const marginPct = revenueUsd > 0 ? (profitUsd / revenueUsd) * 100 : 0;
      const imageResultUrl = getFalImageResultUrl(resultData);

      if (!imageResultUrl) {
        console.log(`[generate-image] WARNING: No image URL in provider response. Keys: ${Object.keys(resultData || {}).join(', ')}`);
        console.log(`[generate-image] Response snippet: ${JSON.stringify(resultData).slice(0, 500)}`);
        await creditRefunder.refund(supabase);
      }

      try {
        const logData = {
          user_id: user.id,
          model_id: resolvedModelId,
          prompt: prompt.slice(0, 500),
          ratio: selectedRatio,
          resolution: selectedQuality,
          quality_tier: selectedQuality,
          credits_used: creditsUsed,
          credits_charged_at: existingJob?.credits_charged_at || new Date().toISOString(),
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
          error_message: imageResultUrl ? null : 'No image URL found in provider response.',
          status: imageResultUrl ? "completed" : "failed",
          used_image_input: isImageToImage,
          input_image_urls: isImageToImage ? allInputUrls : [],
          source_mode: isImageToImage ? 'image-to-image' : 'text-to-image',
        };

        if (job_id) {
          const { status: _status, error_message, ...logFields } = logData;
          if (imageResultUrl) {
            await markJobCompleted(supabase, job_id, { ...logFields, error_message });
          } else {
            await markJobFailed(supabase, job_id, "No image URL found in provider response.", logFields);
          }
        } else {
          await supabase.from("generation_logs").insert(logData);
        }
      } catch (e) {
        console.log("Generation log error (non-fatal):", e);
      }

      if (!imageResultUrl) {
        return { ok: false as const, error: 'No image URL found in provider response.' };
      }

      console.log(`[generate-image] Done. job_id=${job_id || 'none'} mode=${isImageToImage ? 'i2i' : 't2i'} genCost=$${actualApiCost.toFixed(4)} total=$${totalCost.toFixed(4)} margin=${marginPct.toFixed(1)}%`);
      const normalizedImages = resultData?.images || (resultData?.image ? [resultData.image] : []);
      return {
        ok: true as const,
        payload: {
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
        },
      };
    };

    // GPT Image 2 uses fal webhooks so the edge function can return immediately.
    if (job_id && isGptImage2Endpoint(activeEndpoint)) {
      const webhookSecret = Deno.env.get("FAL_WEBHOOK_SECRET");
      if (!webhookSecret || !SUPABASE_URL) {
        const message = "FAL_WEBHOOK_SECRET or SUPABASE_URL is not configured";
        await creditRefunder.refund(supabase);
        await markJobFailed(supabase, job_id, message);
        return jsonResponse({ error: message }, 500);
      }

      await supabase.from("generation_logs").update({
        status: "processing",
        error_message: null,
        model_id: resolvedModelId,
        prompt: prompt.slice(0, 500),
        ratio: selectedRatio,
        resolution: selectedQuality,
        quality_tier: selectedQuality,
        requested_ratio: selectedRatio,
        requested_quality_tier: selectedQuality,
        credits_used: creditsUsed,
        actual_api_cost: actualApiCost,
        generation_cost: actualApiCost,
        used_image_input: isImageToImage,
        input_image_urls: isImageToImage ? allInputUrls : [],
        source_mode: isImageToImage ? 'image-to-image' : 'text-to-image',
      }).eq("id", job_id);

      const webhookUrl = `${SUPABASE_URL}/functions/v1/fal-webhook?job_id=${encodeURIComponent(job_id)}&secret=${encodeURIComponent(webhookSecret)}`;
      deferTask(async () => {
        const submitResult = await submitFalQueueWebhook(activeEndpoint, payload, falHeaders, webhookUrl);
        if (submitResult.error) {
          await creditRefunder.refund(supabase);
          await markJobFailed(supabase, job_id, submitResult.error);
        }
      });

      return new Response(JSON.stringify({
        queued: true,
        model_used: activeEndpoint,
        credits_used: creditsUsed,
        requested_ratio: selectedRatio,
        requested_quality: selectedQuality,
        job_id,
        is_image_to_image: isImageToImage,
      }), {
        status: 202,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Submit remaining slow endpoints to fal, then finalize in the background.
    if (SLOW_ENDPOINTS.has(activeEndpoint) && job_id) {
      const sub = await submitFalQueue(activeEndpoint, payload, falHeaders);
      if (sub.error) {
        await creditRefunder.refund(supabase);
        await markJobFailed(supabase, job_id, sub.error);
        return new Response(JSON.stringify({ error: sub.error }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await markJobGenerating(supabase, job_id);

      const backgroundWork = (async () => {
        try {
          const polled = await pollFalQueueUntilDone(sub.submit || {}, falHeaders, { maxAttempts: 200, intervalMs: 3000, label: activeEndpoint });
          await finalizeJob(polled);
        } catch (e) {
          console.error(`[generate-image] background finalize failed for job ${job_id}:`, e);
          await creditRefunder.refund(supabase);
          await markJobFailed(supabase, job_id, e instanceof Error ? e.message : "Background finalize error");
        }
      })();

      // Keep the function alive until background work completes, even after we respond.
      const edgeRuntime = (globalThis as { EdgeRuntime?: { waitUntil?: (promise: Promise<unknown>) => void } }).EdgeRuntime;
      try { edgeRuntime?.waitUntil?.(backgroundWork); } catch (error) {
        console.warn("[generate-image] EdgeRuntime.waitUntil unavailable:", error);
      }

      return new Response(JSON.stringify({
        status: "queued",
        job_id,
        provider_request_id: sub.submit?.request_id || null,
        model_used: activeEndpoint,
      }), { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ===== SYNCHRONOUS PATH (default — fast endpoints) =====
    const genResult = await runFalQueue(activeEndpoint, payload, falHeaders);
    const finalized = await finalizeJob(genResult);
    if (!finalized.ok) {
      return new Response(JSON.stringify({ error: finalized.error }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify(finalized.payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("generate-image error:", error);
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await creditRefunder.refund(supabase);
        const { job_id } = await req.clone().json();
        if (job_id) {
          await markJobFailed(supabase, job_id, error instanceof Error ? error.message : "Unknown error");
        }
      } catch {
        // no-op
      }
    }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
