import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import { runFalQueue } from "../_shared/fal.ts";
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const creditRefunder = makeCreditRefunder();

  try {
    const FAL_AI_API_KEY = Deno.env.get("FAL_AI_API_KEY");
    if (!FAL_AI_API_KEY) throw new Error("FAL_AI_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader || !SUPABASE_ANON_KEY) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const { tool_slug, prompt, image_url, options, job_id } = body;

    if (!tool_slug) {
      return jsonResponse({ error: "tool_slug is required" }, 400);
    }

    // Load tool config from DB
    const { data: tool, error: toolErr } = await supabase
      .from("tools")
      .select("*")
      .eq("slug", tool_slug)
      .eq("active", true)
      .single();

    if (toolErr || !tool) {
      if (job_id) {
        await supabase.from("generation_logs").update({ status: "failed" }).eq("id", job_id);
      }
      return jsonResponse({ error: "Tool not found or inactive" }, 404);
    }

    const falHeaders = {
      Authorization: `Key ${FAL_AI_API_KEY}`,
      "Content-Type": "application/json",
    };
    const runToolFalOptions = {
      failureMessagePrefix: "Processing failed",
      timeoutMessage: "Processing timed out",
      logEvery: 1,
    };

    // ── RESOLVE PROVIDER ──
    let endpoint = tool.provider_endpoint;
    let creditCost = Number(tool.default_credit_cost ?? 0);
    let actualCost = Number(tool.internal_provider_cost_estimate ?? 0);
    const creditValueUsd = 0.016;

    const requestedEndpoint = options?.provider_endpoint;

    if (requestedEndpoint) {
      const { data: provider } = await supabase
        .from("tool_providers")
        .select("*")
        .eq("tool_id", tool.id)
        .eq("provider_endpoint", requestedEndpoint)
        .eq("is_active", true)
        .single();

      if (provider) {
        endpoint = provider.provider_endpoint;
        creditCost = Number(provider.credit_cost ?? creditCost);
        actualCost = Number(provider.internal_cost_usd ?? actualCost);
        console.log(`[run-tool] Using provider: ${provider.display_name} (${endpoint}) — ${creditCost} credits`);
      } else {
        console.warn(`[run-tool] Requested endpoint ${requestedEndpoint} not found in tool_providers, using tool default`);
      }
    } else {
      const { data: defaultProvider } = await supabase
        .from("tool_providers")
        .select("*")
        .eq("tool_id", tool.id)
        .eq("is_default", true)
        .eq("is_active", true)
        .single();

      if (defaultProvider) {
        endpoint = defaultProvider.provider_endpoint;
        creditCost = Number(defaultProvider.credit_cost ?? creditCost);
        actualCost = Number(defaultProvider.internal_cost_usd ?? actualCost);
        console.log(`[run-tool] Using default provider: ${defaultProvider.display_name} (${endpoint})`);
      }
    }

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
        amount: creditCost,
        modelId: null,
        resolution: options?.ratio || "1K",
        toolId: tool_slug,
      });

      if (!deductData?.success) {
        await markJobFailed(supabase, job_id, deductData?.error || "Credit deduction failed");
        return jsonResponse({ error: deductData?.error || "Credit deduction failed" }, 400);
      }

      creditRefunder.trackCharge(user.id, creditCost);

      if (job_id) {
        await markJobGenerating(supabase, job_id, {
          credits_used: creditCost,
          credits_charged_at: new Date().toISOString(),
        });
      }
    } else {
      await markJobGenerating(supabase, job_id);
    }

    // Create tool_run record as "processing"
    const { data: runRecord } = await supabase.from("tool_runs").insert({
      user_id: user.id,
      tool_id: tool.id,
      tool_slug: tool.slug,
      provider_name: tool.provider_name,
      provider_endpoint: endpoint,
      input_prompt: prompt || null,
      input_image_url: image_url || null,
      input_options_json: options || {},
      status: "processing",
      credits_charged: creditCost,
      estimated_provider_cost: actualCost,
      started_at: new Date().toISOString(),
    }).select().single();

    const runId = runRecord?.id;

    let resultData: any = null;
    let outputUrl: string | null = null;
    let outputImages: any[] = [];

    try {
      // =================== TOOL-SPECIFIC LOGIC ===================

      if (tool_slug === "generate") {
        const ratio = options?.ratio || "1:1";
        const payload: Record<string, unknown> = {
          prompt,
          num_images: 1,
          enable_safety_checker: true,
          image_size: "square_hd",
        };
        const presetMap: Record<string, string> = {
          "1:1": "square_hd", "16:9": "landscape_16_9", "9:16": "portrait_16_9",
          "4:3": "landscape_4_3", "3:4": "portrait_4_3",
        };
        payload.image_size = presetMap[ratio] || "square_hd";

        resultData = await runFalQueue(endpoint, payload, falHeaders, runToolFalOptions);
        if (resultData.error) throw new Error(resultData.error);

        outputImages = resultData.data?.images || [];
        outputUrl = outputImages[0]?.url || null;

      } else if (tool_slug === "upscale" || tool_slug === "enhance") {
        if (!image_url) throw new Error("image_url is required");

        let payload: Record<string, unknown> = { image_url };

        if (endpoint.includes("clarity-upscaler")) {
          payload = {
            image_url,
            scale_factor: 2,
            creativity: tool_slug === "enhance" ? 0.3 : 0.35,
            resemblance: 0.6,
            detail: 1.0,
            ...(tool_slug === "enhance" ? {
              prompt: options?.mode === "Portrait" ? "enhance portrait photo, sharp details, natural skin tones" :
                      options?.mode === "Landscape" ? "enhance landscape photo, vivid colors, sharp details" :
                      options?.mode === "Product" ? "enhance product photo, sharp details, clean background" :
                      "enhance photo, improve quality, sharpen details",
              shape_preservation: 0.25,
            } : {}),
          };
        } else if (endpoint.includes("topaz")) {
          // Use High Fidelity V2 for upscale (preserves detail), Standard V2 for enhance (more generative)
          const topazModel = tool_slug === "enhance" ? "Standard V2" : "High Fidelity V2";
          payload = {
            image_url,
            model: topazModel,
            upscale_factor: 2,
            output_format: "png",
            face_enhancement: true,
            face_enhancement_strength: 0.8,
          };
        } else if (endpoint.includes("esrgan")) {
          payload = { image_url, scale: 2 };
        } else if (endpoint.includes("creative-upscaler")) {
          payload = { image_url, scale: 2, creativity: 0.5 };
        } else {
          payload = { image_url, scale_factor: 2 };
        }

        resultData = await runFalQueue(endpoint, payload, falHeaders, {
          ...runToolFalOptions,
          maxAttempts: endpoint.includes("topaz") ? 45 : 60,
        });
        if (resultData.error) throw new Error(resultData.error);

        outputUrl = resultData.data?.image?.url || resultData.data?.images?.[0]?.url || null;
        if (outputUrl) outputImages = [{ url: outputUrl }];

      } else if (tool_slug === "logo") {
        if (!prompt) throw new Error("prompt is required for logo generation");

        const payload: Record<string, unknown> = {
          prompt: `Logo design: ${prompt}. Style: ${options?.style || 'minimal modern'}. ${options?.brandName ? `Brand name: ${options.brandName}.` : ''} Clean, professional, vector-style logo on white background.`,
          image_size: { width: 1024, height: 1024 },
          style: "digital_illustration",
        };

        if (endpoint.includes("ideogram")) {
          payload.prompt = `Logo: ${prompt}. ${options?.style || 'minimal'} style. Clean professional design.`;
          delete payload.style;
        }

        resultData = await runFalQueue(endpoint, payload, falHeaders, runToolFalOptions);
        if (resultData.error) throw new Error(resultData.error);

        outputImages = resultData.data?.images || [];
        outputUrl = outputImages[0]?.url || null;

      } else if (tool_slug === "remove-bg") {
        if (!image_url) throw new Error("image_url is required for background removal");

        resultData = await runFalQueue(endpoint, { image_url }, falHeaders, runToolFalOptions);
        if (resultData.error) throw new Error(resultData.error);

        outputUrl = resultData.data?.image?.url || null;
        if (outputUrl) outputImages = [{ url: outputUrl }];

      } else {
        throw new Error(`Unknown tool: ${tool_slug}`);
      }

      // Calculate economics
      const revenue = creditCost * creditValueUsd;
      const margin = revenue - actualCost;

      // Update tool_run as completed
      if (runId) {
        await supabase.from("tool_runs").update({
          status: "completed",
          output_image_url: outputUrl,
          output_images_json: outputImages,
          credits_charged: creditCost,
          provider_endpoint: endpoint,
          estimated_provider_cost: actualCost,
          revenue,
          margin,
          completed_at: new Date().toISOString(),
        }).eq("id", runId);
      }

      // Update generation_logs if job_id was provided
      if (job_id && outputUrl) {
        await markJobCompleted(supabase, job_id, {
          image_url: outputUrl,
          credits_used: creditCost,
          credits_charged_at: existingJob?.credits_charged_at || new Date().toISOString(),
          provider_cost: actualCost,
          revenue: revenue,
          revenue_usd: revenue,
          margin: margin,
          profit_usd: margin,
          actual_api_cost: actualCost,
        });
      }

      console.log(`[run-tool] ${tool_slug} completed via ${endpoint}. output=${outputUrl} cost=$${actualCost} revenue=$${revenue}`);

      return new Response(JSON.stringify({
        success: true,
        tool_slug,
        run_id: runId,
        job_id: job_id || null,
        output_url: outputUrl,
        output_images: outputImages,
        credits_charged: creditCost,
        estimated_cost: actualCost,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (toolError) {
      const errorMsg = toolError instanceof Error ? toolError.message : "Unknown error";
      await creditRefunder.refund(supabase);

      if (runId) {
        await supabase.from("tool_runs").update({
          status: "failed",
          error_message: errorMsg,
          failed_at: new Date().toISOString(),
          credits_charged: 0,
        }).eq("id", runId);
      }

      // Update generation_logs if job_id was provided
      if (job_id) {
        await markJobFailed(supabase, job_id, undefined, { credits_used: 0 });
      }

      console.error(`[run-tool] ${tool_slug} failed:`, toolError);
      return new Response(JSON.stringify({
        error: errorMsg,
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error) {
    console.error("run-tool error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
