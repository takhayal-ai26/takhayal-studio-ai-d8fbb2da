import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

  // Advanced upscaler can take up to 60s, so poll up to 90 iterations (180s)
  const maxPolls = endpoint.includes("flux-vision") ? 90 : 60;
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

  try {
    const FAL_AI_API_KEY = Deno.env.get("FAL_AI_API_KEY");
    if (!FAL_AI_API_KEY) throw new Error("FAL_AI_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { tool_slug, prompt, image_url, options } = body;

    if (!tool_slug) {
      return new Response(JSON.stringify({ error: "tool_slug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load tool config from DB
    const { data: tool, error: toolErr } = await supabase
      .from("tools")
      .select("*")
      .eq("slug", tool_slug)
      .eq("active", true)
      .single();

    if (toolErr || !tool) {
      return new Response(JSON.stringify({ error: "Tool not found or inactive" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const falHeaders = {
      Authorization: `Key ${FAL_AI_API_KEY}`,
      "Content-Type": "application/json",
    };

    let endpoint = tool.provider_endpoint;
    let creditCost = tool.default_credit_cost;
    const creditValueUsd = 0.016;

    // Create tool_run record as "processing"
    const { data: runRecord } = await supabase.from("tool_runs").insert({
      tool_id: tool.id,
      tool_slug: tool.slug,
      provider_name: tool.provider_name,
      provider_endpoint: endpoint,
      input_prompt: prompt || null,
      input_image_url: image_url || null,
      input_options_json: options || {},
      status: "processing",
      credits_charged: creditCost,
      estimated_provider_cost: Number(tool.internal_provider_cost_estimate),
      started_at: new Date().toISOString(),
    }).select().single();

    const runId = runRecord?.id;

    let resultData: any = null;
    let outputUrl: string | null = null;
    let outputImages: any[] = [];
    let actualCost = Number(tool.internal_provider_cost_estimate);

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

      } else if (tool_slug === "upscale") {
        // ===== NEW UPSCALE SYSTEM: Standard (Clarity) / Advanced (Flux Vision) =====
        if (!image_url) throw new Error("image_url is required for upscale");

        const tier = options?.tier || "standard";

        if (tier === "advanced") {
          // Flux Vision Upscaler
          endpoint = "fal-ai/flux-vision-upscaler";
          creditCost = 15;
          actualCost = 0.10;
          const payload = {
            image_url,
            scale_factor: 2,
            prompt: "highly detailed, sharp, professional quality, enhanced textures",
          };
          resultData = await falQueueRun(endpoint, payload, falHeaders);
        } else {
          // Clarity Upscaler (standard)
          endpoint = "fal-ai/clarity-upscaler";
          creditCost = 5;
          actualCost = 0.03;
          const payload = {
            image_url,
            scale_factor: 2,
            creativity: 0.35,
            resemblance: 0.6,
            detail: 1.0,
          };
          resultData = await falQueueRun(endpoint, payload, falHeaders);
        }

        if (resultData.error) throw new Error(resultData.error);

        outputUrl = resultData.data?.image?.url || null;
        if (outputUrl) outputImages = [{ url: outputUrl }];

      } else if (tool_slug === "logo") {
        if (!prompt) throw new Error("prompt is required for logo generation");

        const payload: Record<string, unknown> = {
          prompt: `Logo design: ${prompt}. Style: ${options?.style || 'minimal modern'}. ${options?.brandName ? `Brand name: ${options.brandName}.` : ''} Clean, professional, vector-style logo on white background.`,
          image_size: { width: 1024, height: 1024 },
          style: "digital_illustration",
        };

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

      } else if (tool_slug === "enhance") {
        if (!image_url) throw new Error("image_url is required for enhancement");

        const payload: Record<string, unknown> = {
          image_url,
          scale: 2,
          creativity: 0.3,
          detail: 1,
          shape_preservation: 0.25,
          prompt: options?.mode === "Portrait" ? "enhance portrait photo, sharp details, natural skin tones" :
                  options?.mode === "Landscape" ? "enhance landscape photo, vivid colors, sharp details" :
                  options?.mode === "Product" ? "enhance product photo, sharp details, clean background" :
                  "enhance photo, improve quality, sharpen details",
        };

        resultData = await falQueueRun(endpoint, payload, falHeaders);
        if (resultData.error) throw new Error(resultData.error);

        outputUrl = resultData.data?.image?.url || null;
        if (outputUrl) outputImages = [{ url: outputUrl }];

      } else {
        throw new Error(`Unknown tool: ${tool_slug}`);
      }

      // Calculate economics
      const revenue = creditCost * creditValueUsd;
      const margin = revenue - actualCost;

      // Update run as completed
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

      console.log(`[run-tool] ${tool_slug} completed. output=${outputUrl} cost=$${actualCost} revenue=$${revenue}`);

      return new Response(JSON.stringify({
        success: true,
        tool_slug,
        run_id: runId,
        output_url: outputUrl,
        output_images: outputImages,
        credits_charged: creditCost,
        estimated_cost: actualCost,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (toolError) {
      if (runId) {
        await supabase.from("tool_runs").update({
          status: "failed",
          error_message: toolError instanceof Error ? toolError.message : "Unknown error",
          failed_at: new Date().toISOString(),
          credits_charged: 0,
        }).eq("id", runId);
      }

      console.error(`[run-tool] ${tool_slug} failed:`, toolError);
      return new Response(JSON.stringify({
        error: toolError instanceof Error ? toolError.message : "Tool execution failed",
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
