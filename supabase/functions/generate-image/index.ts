import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

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

type SupabaseClientInstance = ReturnType<typeof createClient>;
type GenerationJobRow = {
  id: string;
  user_id: string | null;
  status: string | null;
  credits_charged_at?: string | null;
};
type DeductCreditsResult = {
  success?: boolean;
  error?: string;
};

// ===== CENTRALIZED COST ENGINE =====
const CREDIT_VALUE_USD = 0.016;

const BASE_DIMS: Record<string, { w: number; h: number }> = {
  "1:1": { w: 1024, h: 1024 }, "16:9": { w: 1344, h: 768 }, "9:16": { w: 768, h: 1344 },
  "4:3": { w: 1184, h: 896 }, "3:4": { w: 896, h: 1184 }, "4:5": { w: 896, h: 1120 },
  "5:4": { w: 1120, h: 896 }, "3:2": { w: 1216, h: 832 }, "2:3": { w: 832, h: 1216 },
  "21:9": { w: 1536, h: 640 },
};

const GPT_IMAGE_2_MAX_EDGE = 3840;
const GPT_IMAGE_2_MAX_PIXELS = 8_294_400;
const GPT_IMAGE_2_MIN_PIXELS = 655_360;

function isGptImage2Endpoint(endpoint: string) {
  return endpoint === "fal-ai/gpt-image-2"
    || endpoint === "openai/gpt-image-2"
    || endpoint === "fal-ai/gpt-image-2/edit"
    || endpoint === "openai/gpt-image-2/edit";
}

function normalizeGptImage2Endpoint(endpoint: string) {
  if (endpoint === "fal-ai/gpt-image-2") return "openai/gpt-image-2";
  if (endpoint === "fal-ai/gpt-image-2/edit") return "openai/gpt-image-2/edit";
  return endpoint;
}

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
  "fal-ai/gpt-image-2":     { type: "quality_tier", cost1k: 0.04, cost2k: 0.08 },
  "openai/gpt-image-2":     { type: "quality_tier", cost1k: 0.04, cost2k: 0.08 },
  "fal-ai/gpt-image-2/edit": { type: "quality_tier", cost1k: 0.04, cost2k: 0.08 },
  "openai/gpt-image-2/edit": { type: "quality_tier", cost1k: 0.04, cost2k: 0.08 },
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

function clampGptImage2Dims(ratio: string, quality: string) {
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

  // GPT Image 2 — text and edit use separate endpoints but share native image_size + quality controls
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
  // Seedream edit — ALWAYS requires image_urls as an array (not image_url singular)
  if (endpoint.includes("seedream") && endpoint.includes("/edit")) {
    const dims = getResolutionDims(ratio, quality);
    const base: Record<string, unknown> = { image_size: { width: dims.width, height: dims.height } };
    // Seedream edit API requires image_urls (array), never image_url (singular)
    if (allImageUrls.length > 0) base.image_urls = allImageUrls;
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
// Slow endpoints (GPT Image 2) where inference can exceed Supabase edge function wall-clock.
// For these, we return the queued response immediately and finish the work in the background
// via EdgeRuntime.waitUntil (so the row is updated when fal completes, even after the HTTP
// response is closed).
const SLOW_ENDPOINTS = new Set<string>([
  "fal-ai/gpt-image-2",
  "openai/gpt-image-2/edit",
]);

async function falSubmit(endpoint: string, payload: Record<string, unknown>, falHeaders: Record<string, string>): Promise<{ submit?: any; error?: string }> {
  const submitRes = await fetch(`https://queue.fal.run/${endpoint}`, {
    method: "POST", headers: falHeaders, body: JSON.stringify(payload),
  });
  if (!submitRes.ok) {
    const errorText = await submitRes.text();
    console.error(`fal.ai submit error for ${endpoint}:`, submitRes.status, errorText);
    return { error: `fal.ai API error ${submitRes.status}: ${errorText}` };
  }
  return { submit: await submitRes.json() };
}

async function falPollUntilDone(submit: any, falHeaders: Record<string, string>, opts: { maxAttempts?: number; intervalMs?: number; label?: string } = {}): Promise<{ data: any; error?: string }> {
  const { status_url, response_url } = submit || {};
  if (!status_url || !response_url) return { data: submit };
  const maxAttempts = opts.maxAttempts ?? 180;   // up to ~9 min at 3s
  const intervalMs = opts.intervalMs ?? 3000;
  const label = opts.label || "poll";
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs));
    const statusRes = await fetch(status_url, { headers: falHeaders });
    const statusData = await statusRes.json();
    if (i % 5 === 0) console.log(`[${label}] Poll ${i + 1}: ${statusData.status}`);
    if (statusData.status === "COMPLETED") {
      const resultRes = await fetch(response_url, { headers: falHeaders });
      return { data: await resultRes.json() };
    }
    if (statusData.status === "FAILED") return { data: null, error: `Generation failed: ${JSON.stringify(statusData)}` };
  }
  return { data: null, error: `Generation timed out after ${(maxAttempts * intervalMs) / 1000}s` };
}

// Backwards-compatible synchronous runner used for fast endpoints + upscale steps.
async function falQueueRun(endpoint: string, payload: Record<string, unknown>, falHeaders: Record<string, string>): Promise<{ data: any; error?: string }> {
  const sub = await falSubmit(endpoint, payload, falHeaders);
  if (sub.error) return { data: null, error: sub.error };
  return await falPollUntilDone(sub.submit, falHeaders, { maxAttempts: 60, intervalMs: 2000, label: endpoint });
}

async function falQueueSubmit(endpoint: string, payload: Record<string, unknown>, falHeaders: Record<string, string>, webhookUrl: string): Promise<{ data: any; error?: string }> {
  const submitRes = await fetch(`https://queue.fal.run/${endpoint}?fal_webhook=${encodeURIComponent(webhookUrl)}`, {
    method: "POST",
    headers: falHeaders,
    body: JSON.stringify(payload),
  });

  if (!submitRes.ok) {
    const errorText = await submitRes.text();
    console.error(`fal.ai queue submit error for ${endpoint}:`, submitRes.status, errorText);
    return { data: null, error: `fal.ai API error ${submitRes.status}: ${errorText}` };
  }

  return { data: await submitRes.json() };
}

function getImageResultUrl(resultData: any): string | null {
  return resultData?.images?.[0]?.url
    || resultData?.image?.url
    || resultData?.output?.url
    || (typeof resultData?.output === 'string' ? resultData.output : null)
    || (Array.isArray(resultData?.output) ? resultData.output[0]?.url || resultData.output[0] : null)
    || null;
}

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

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  let chargedUserId: string | null = null;
  let chargedCredits = 0;

  const refundChargedCredits = async (supabase: SupabaseClientInstance) => {
    if (!chargedUserId || chargedCredits <= 0) return;
    await supabase.rpc("refund_credits", { p_user_id: chargedUserId, p_amount: chargedCredits });
    chargedUserId = null;
    chargedCredits = 0;
  };

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
      const { data: jobData, error: jobError } = await supabase
        .from("generation_logs")
        .select("id, user_id, status, credits_charged_at")
        .eq("id", job_id)
        .single();

      if (jobError || !jobData) {
        return jsonResponse({ error: "Generation job not found" }, 404);
      }
      if (jobData.user_id !== user.id) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }
      if (jobData.status === "completed") {
        return jsonResponse({ error: "Generation job already completed" }, 409);
      }
      existingJob = jobData as GenerationJobRow;
    }

    if (!existingJob?.credits_charged_at) {
      const { data: deductResult } = await supabase.rpc("deduct_credits", {
        p_user_id: user.id,
        p_amount: creditsUsed,
        p_model_id: resolvedModelId,
        p_resolution: selectedQuality,
      });

      const deductData = deductResult as DeductCreditsResult | null;
      if (!deductData?.success) {
        if (job_id) {
          await supabase.from("generation_logs").update({
            status: "failed",
            error_message: deductData?.error || "Credit deduction failed",
          }).eq("id", job_id);
        }
        return jsonResponse({ error: deductData?.error || "Credit deduction failed" }, 400);
      }

      chargedUserId = user.id;
      chargedCredits = creditsUsed;

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

    const payloadParams = resolvePayload(
      activeEndpoint,
      selectedRatio,
      generateQuality,
      modelInputType,
      isImageToImage && allInputUrls.length === 1 ? allInputUrls[0] : undefined,
      isImageToImage && allInputUrls.length > 1 ? allInputUrls : (isImageToImage && allInputUrls.length === 1 ? allInputUrls : undefined),
    );
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
        await refundChargedCredits(supabase);
        if (job_id) {
          await supabase.from("generation_logs").update({ status: "failed", error_message: genResult.error }).eq("id", job_id);
        }
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
      const imageResultUrl = getImageResultUrl(resultData);

      if (!imageResultUrl) {
        console.log(`[generate-image] WARNING: No image URL in provider response. Keys: ${Object.keys(resultData || {}).join(', ')}`);
        console.log(`[generate-image] Response snippet: ${JSON.stringify(resultData).slice(0, 500)}`);
        await refundChargedCredits(supabase);
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
          await supabase.from("generation_logs").update(logData).eq("id", job_id);
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
        await refundChargedCredits(supabase);
        await supabase.from("generation_logs").update({ status: "failed", error_message: message }).eq("id", job_id);
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
        const submitResult = await falQueueSubmit(activeEndpoint, payload, falHeaders, webhookUrl);
        if (submitResult.error) {
          await refundChargedCredits(supabase);
          await supabase.from("generation_logs").update({
            status: "failed",
            error_message: submitResult.error,
          }).eq("id", job_id);
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
      const sub = await falSubmit(activeEndpoint, payload, falHeaders);
      if (sub.error) {
        await refundChargedCredits(supabase);
        await supabase.from("generation_logs").update({ status: "failed", error_message: sub.error }).eq("id", job_id);
        return new Response(JSON.stringify({ error: sub.error }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await supabase.from("generation_logs").update({ status: "generating" }).eq("id", job_id);

      const backgroundWork = (async () => {
        try {
          const polled = await falPollUntilDone(sub.submit, falHeaders, { maxAttempts: 200, intervalMs: 3000, label: activeEndpoint });
          await finalizeJob(polled);
        } catch (e) {
          console.error(`[generate-image] background finalize failed for job ${job_id}:`, e);
          await refundChargedCredits(supabase);
          await supabase.from("generation_logs").update({
            status: "failed",
            error_message: e instanceof Error ? e.message : "Background finalize error",
          }).eq("id", job_id);
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
    const genResult = await falQueueRun(activeEndpoint, payload, falHeaders);
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
        await refundChargedCredits(supabase);
        const { job_id } = await req.clone().json();
        if (job_id) {
          await supabase
            .from("generation_logs")
            .update({ status: "failed", error_message: error instanceof Error ? error.message : "Unknown error" })
            .eq("id", job_id);
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
