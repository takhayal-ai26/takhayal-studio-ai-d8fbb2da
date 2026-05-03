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

async function falQueueRun(
  endpoint: string,
  payload: Record<string, unknown>,
  falHeaders: Record<string, string>
): Promise<{ data: any; error?: string }> {
  const submitRes = await fetch(`https://queue.fal.run/${endpoint}`, {
    method: "POST",
    headers: falHeaders,
    body: JSON.stringify(payload),
  });
  if (!submitRes.ok) {
    const errorText = await submitRes.text();
    console.error(`fal.ai error for ${endpoint}:`, submitRes.status, errorText);
    return { data: null, error: `fal.ai API error ${submitRes.status}: ${errorText}` };
  }
  const submitData = await submitRes.json();
  const { status_url, response_url } = submitData;
  if (!status_url || !response_url) return { data: submitData };

  const maxPolls = endpoint.includes("topaz") ? 45 : 60;
  for (let i = 0; i < maxPolls; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const statusRes = await fetch(status_url, { headers: falHeaders });
    const statusData = await statusRes.json();
    console.log(`[${endpoint}] Poll ${i + 1}: ${statusData.status}`);
    if (statusData.status === "COMPLETED") {
      const resultRes = await fetch(response_url, { headers: falHeaders });
      return { data: await resultRes.json() };
    }
    if (statusData.status === "FAILED")
      return { data: null, error: `Processing failed: ${JSON.stringify(statusData)}` };
  }
  return { data: null, error: "Processing timed out" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
        p_amount: creditCost,
        p_model_id: null,
        p_resolution: options?.ratio || "1K",
        p_tool_id: tool_slug,
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
      chargedCredits = creditCost;

      if (job_id) {
        await supabase.from("generation_logs").update({
          status: "generating",
          credits_used: creditCost,
          credits_charged_at: new Date().toISOString(),
        }).eq("id", job_id);
      }
    } else {
      await supabase.from("generation_logs").update({ status: "generating" }).eq("id", job_id);
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

        resultData = await falQueueRun(endpoint, payload, falHeaders);
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

        resultData = await falQueueRun(endpoint, payload, falHeaders);
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

        resultData = await falQueueRun(endpoint, payload, falHeaders);
        if (resultData.error) throw new Error(resultData.error);

        outputImages = resultData.data?.images || [];
        outputUrl = outputImages[0]?.url || null;

      } else if (tool_slug === "remove-bg") {
        if (!image_url) throw new Error("image_url is required for background removal");

        resultData = await falQueueRun(endpoint, { image_url }, falHeaders);
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
        await supabase.from("generation_logs").update({
          status: "completed",
          image_url: outputUrl,
          credits_used: creditCost,
          credits_charged_at: existingJob?.credits_charged_at || new Date().toISOString(),
          provider_cost: actualCost,
          revenue: revenue,
          revenue_usd: revenue,
          margin: margin,
          profit_usd: margin,
          actual_api_cost: actualCost,
        }).eq("id", job_id);
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
      await refundChargedCredits(supabase);

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
        await supabase.from("generation_logs").update({
          status: "failed",
          credits_used: 0,
        }).eq("id", job_id);
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
