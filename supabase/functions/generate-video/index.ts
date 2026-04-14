import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_VALUE_USD = 0.016;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const falKey = Deno.env.get("FAL_AI_API_KEY")!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { prompt, aspect_ratio, quality, duration, model_id, job_id, image_url, generate_audio, end_frame_url } = body;

    if (!prompt || !model_id || !job_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch from video_models table
    const { data: videoModel, error: vmError } = await adminClient
      .from("video_models")
      .select("*")
      .eq("id", model_id)
      .single();

    if (vmError || !videoModel) {
      // Fallback: try legacy models table
      const { data: legacyModel, error: legacyError } = await adminClient
        .from("models")
        .select("*")
        .eq("id", model_id)
        .single();

      if (legacyError || !legacyModel) {
        await adminClient.from("generation_logs").update({ status: "failed" }).eq("id", job_id);
        return new Response(JSON.stringify({ error: "Model not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Use legacy flow for backward compatibility
      return handleLegacyModel(adminClient, user, legacyModel, body, falKey);
    }

    // Calculate credits from video_models
    const durationSec = parseInt(String(duration).replace("s", ""), 10) || 5;
    const audioOn = generate_audio === true && videoModel.supports_audio;
    const costPerSec = audioOn ? videoModel.credit_cost_per_second_with_audio : videoModel.credit_cost_per_second_no_audio;
    const creditCost = durationSec * costPerSec;
    const providerCost = creditCost * CREDIT_VALUE_USD * 0.5; // estimated

    // Deduct credits
    const { data: deductResult } = await adminClient.rpc("deduct_credits", {
      p_user_id: user.id,
      p_amount: creditCost,
      p_model_id: model_id,
      p_resolution: quality || "720p",
    });

    const deductData = deductResult as any;
    if (!deductData?.success) {
      await adminClient.from("generation_logs").update({ status: "failed" }).eq("id", job_id);
      return new Response(JSON.stringify({ error: deductData?.error || "Credit deduction failed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const endpoint = videoModel.fal_endpoint;

    // Build fal.ai payload
    const falPayload: Record<string, unknown> = { prompt };

    if (image_url) {
      falPayload.image_url = image_url;
    }
    if (end_frame_url) {
      falPayload.tail_image_url = end_frame_url;
    }
    if (aspect_ratio) {
      falPayload.aspect_ratio = aspect_ratio;
    }
    if (durationSec) {
      falPayload.duration = durationSec;
    }
    if (quality) {
      falPayload.resolution = quality;
    }
    if (audioOn) {
      falPayload.generate_audio = true;
    }

    const sourceMode = image_url ? "image-to-video" : "text-to-video";

    // Update status to generating
    await adminClient.from("generation_logs").update({
      status: "generating",
      media_type: "video",
      source_mode: sourceMode,
      duration: duration || `${durationSec}s`,
    }).eq("id", job_id);

    // Call fal.ai
    console.log(`[generate-video] Calling ${endpoint} for job ${job_id}`);
    const falResponse = await fetch(`https://queue.fal.run/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(falPayload),
    });

    if (!falResponse.ok) {
      const errText = await falResponse.text();
      console.error(`[generate-video] fal.ai error: ${falResponse.status} ${errText}`);
      await adminClient.rpc("refund_credits", { p_user_id: user.id, p_amount: creditCost });
      await adminClient.from("generation_logs").update({ status: "failed" }).eq("id", job_id);
      return new Response(JSON.stringify({ error: "Provider error", details: errText }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const queueData = await falResponse.json();
    const requestId = queueData.request_id;

    const updateCompletion = async (videoUrl: string, thumbnailUrl: string | null) => {
      const revenue = creditCost * CREDIT_VALUE_USD;
      await adminClient.from("generation_logs").update({
        status: "completed",
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        image_url: thumbnailUrl || videoUrl,
        media_type: "video",
        actual_api_cost: providerCost,
        provider_cost: providerCost,
        revenue,
        margin: revenue - providerCost,
        profit_usd: revenue - providerCost,
        revenue_usd: revenue,
      }).eq("id", job_id);
    };

    const handleFailure = async () => {
      await adminClient.rpc("refund_credits", { p_user_id: user.id, p_amount: creditCost });
      await adminClient.from("generation_logs").update({ status: "failed" }).eq("id", job_id);
    };

    if (!requestId) {
      // Direct response
      const videoUrl = queueData.video?.url || queueData.output?.url || queueData.url;
      const thumbnailUrl = queueData.video?.thumbnail_url || queueData.thumbnail_url || null;
      if (videoUrl) await updateCompletion(videoUrl, thumbnailUrl);
      else await handleFailure();
      return new Response(JSON.stringify({ success: true, job_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Poll for result
    let attempts = 0;
    const maxAttempts = 120;
    let completed = false;

    while (attempts < maxAttempts && !completed) {
      await new Promise(r => setTimeout(r, 5000));
      attempts++;

      try {
        const statusRes = await fetch(`https://queue.fal.run/${endpoint}/requests/${requestId}/status`, {
          headers: { Authorization: `Key ${falKey}` },
        });
        if (!statusRes.ok) continue;
        const statusData = await statusRes.json();

        if (statusData.status === "COMPLETED") {
          const resultRes = await fetch(`https://queue.fal.run/${endpoint}/requests/${requestId}`, {
            headers: { Authorization: `Key ${falKey}` },
          });
          const resultData = await resultRes.json();
          const videoUrl = resultData.video?.url || resultData.output?.url || resultData.url;
          const thumbnailUrl = resultData.video?.thumbnail_url || resultData.thumbnail_url || null;
          if (videoUrl) await updateCompletion(videoUrl, thumbnailUrl);
          else await handleFailure();
          completed = true;
        } else if (statusData.status === "FAILED") {
          await handleFailure();
          completed = true;
        }
      } catch (pollErr) {
        console.error(`[generate-video] Poll error:`, pollErr);
      }
    }

    if (!completed) await handleFailure();

    return new Response(JSON.stringify({ success: true, job_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[generate-video] Unhandled error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// Legacy handler for old models table
async function handleLegacyModel(adminClient: any, user: any, model: any, body: any, falKey: string) {
  const { prompt, aspect_ratio, quality, duration, job_id, image_url } = body;
  const creditCost = 10;
  const providerCost = Number(model.cost_per_run ?? 0.10);

  const { data: deductResult } = await adminClient.rpc("deduct_credits", {
    p_user_id: user.id, p_amount: creditCost, p_model_id: model.id, p_resolution: quality || "720p",
  });
  const deductData = deductResult as any;
  if (!deductData?.success) {
    await adminClient.from("generation_logs").update({ status: "failed" }).eq("id", job_id);
    return new Response(JSON.stringify({ error: deductData?.error || "Credit deduction failed" }), { status: 400, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
  }

  const isI2V = !!image_url && model.supports_image_to_video && model.image_to_video_endpoint;
  const endpoint = isI2V ? model.image_to_video_endpoint : model.text_to_video_endpoint || model.endpoint_id;
  const falPayload: Record<string, unknown> = { prompt };
  if (isI2V && image_url) falPayload.image_url = image_url;
  if (aspect_ratio) falPayload.aspect_ratio = aspect_ratio;
  if (duration) falPayload.duration = parseInt(String(duration).replace("s", ""), 10) || 5;
  if (quality) falPayload.resolution = quality;

  await adminClient.from("generation_logs").update({ status: "generating", media_type: "video" }).eq("id", job_id);

  const falResponse = await fetch(`https://queue.fal.run/${endpoint}`, {
    method: "POST", headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(falPayload),
  });

  if (!falResponse.ok) {
    await adminClient.rpc("refund_credits", { p_user_id: user.id, p_amount: creditCost });
    await adminClient.from("generation_logs").update({ status: "failed" }).eq("id", job_id);
    return new Response(JSON.stringify({ error: "Provider error" }), { status: 502, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
  }

  // Simplified: just mark as generating and let polling handle it
  return new Response(JSON.stringify({ success: true, job_id }), { headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } });
}
