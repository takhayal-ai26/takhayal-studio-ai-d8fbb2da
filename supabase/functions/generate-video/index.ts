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
    const { prompt, aspect_ratio, quality, duration, model_id, job_id, image_url } = body;

    if (!prompt || !model_id || !job_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get model config
    const { data: model, error: modelError } = await adminClient
      .from("models")
      .select("*")
      .eq("id", model_id)
      .single();

    if (modelError || !model) {
      await adminClient.from("generation_logs").update({ status: "failed" }).eq("id", job_id);
      return new Response(JSON.stringify({ error: "Model not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get pricing tier
    const { data: tierData } = await adminClient
      .from("model_pricing_tiers")
      .select("credits_charged, cost_per_run")
      .eq("model_id", model_id)
      .eq("quality_level", quality || "720p")
      .eq("duration", duration || "5s")
      .eq("is_available", true)
      .limit(1)
      .maybeSingle();

    const creditCost = tierData?.credits_charged ?? 10;
    const providerCost = Number(tierData?.cost_per_run ?? model.cost_per_run ?? 0.10);

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

    // Determine endpoint
    const isI2V = !!image_url && model.supports_image_to_video && model.image_to_video_endpoint;
    const endpoint = isI2V ? model.image_to_video_endpoint : model.text_to_video_endpoint || model.endpoint_id;
    const sourceMode = isI2V ? "image-to-video" : "text-to-video";

    // Build fal.ai payload
    const falPayload: Record<string, unknown> = { prompt };

    if (isI2V && image_url) {
      falPayload.image_url = image_url;
    }

    // Ratio mapping
    if (aspect_ratio) {
      falPayload.aspect_ratio = aspect_ratio;
    }

    // Duration
    if (duration) {
      const durationSec = parseInt(duration.replace("s", ""), 10);
      falPayload.duration = durationSec || 5;
    }

    // Quality / resolution
    if (quality === "1080p") {
      falPayload.resolution = "1080p";
    } else if (quality === "720p") {
      falPayload.resolution = "720p";
    }

    // Update status to generating
    await adminClient.from("generation_logs").update({
      status: "generating",
      media_type: "video",
      source_mode: sourceMode,
      duration: duration || "5s",
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
      // Refund credits
      await adminClient.rpc("refund_credits", { p_user_id: user.id, p_amount: creditCost });
      await adminClient.from("generation_logs").update({ status: "failed" }).eq("id", job_id);
      return new Response(JSON.stringify({ error: "Provider error", details: errText }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const queueData = await falResponse.json();
    const requestId = queueData.request_id;

    if (!requestId) {
      // Direct response (not queued)
      const videoUrl = queueData.video?.url || queueData.output?.url || queueData.url;
      const thumbnailUrl = queueData.video?.thumbnail_url || queueData.thumbnail_url || null;

      if (videoUrl) {
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
      } else {
        await adminClient.rpc("refund_credits", { p_user_id: user.id, p_amount: creditCost });
        await adminClient.from("generation_logs").update({ status: "failed" }).eq("id", job_id);
      }

      return new Response(JSON.stringify({ success: true, job_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Poll for result
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max
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
          // Fetch result
          const resultRes = await fetch(`https://queue.fal.run/${endpoint}/requests/${requestId}`, {
            headers: { Authorization: `Key ${falKey}` },
          });
          const resultData = await resultRes.json();
          const videoUrl = resultData.video?.url || resultData.output?.url || resultData.url;
          const thumbnailUrl = resultData.video?.thumbnail_url || resultData.thumbnail_url || null;

          if (videoUrl) {
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
          } else {
            await adminClient.rpc("refund_credits", { p_user_id: user.id, p_amount: creditCost });
            await adminClient.from("generation_logs").update({ status: "failed" }).eq("id", job_id);
          }
          completed = true;
        } else if (statusData.status === "FAILED") {
          await adminClient.rpc("refund_credits", { p_user_id: user.id, p_amount: creditCost });
          await adminClient.from("generation_logs").update({ status: "failed" }).eq("id", job_id);
          completed = true;
        }
      } catch (pollErr) {
        console.error(`[generate-video] Poll error:`, pollErr);
      }
    }

    if (!completed) {
      await adminClient.rpc("refund_credits", { p_user_id: user.id, p_amount: creditCost });
      await adminClient.from("generation_logs").update({ status: "failed" }).eq("id", job_id);
    }

    return new Response(JSON.stringify({ success: true, job_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[generate-video] Unhandled error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
