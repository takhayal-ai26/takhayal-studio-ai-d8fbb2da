import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map aspect ratios to fal image_size presets
const RATIO_TO_IMAGE_SIZE: Record<string, string> = {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_AI_API_KEY = Deno.env.get("FAL_AI_API_KEY");
    if (!FAL_AI_API_KEY) throw new Error("FAL_AI_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const { prompt, model_endpoint, aspect_ratio, image_size, num_images, input_type } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine which model to use
    let endpoint = model_endpoint || "fal-ai/flux/schnell";
    let modelInputType = input_type || "image_size";

    // If no model specified, fetch default from DB
    if (!model_endpoint && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: defaultModel } = await supabase
          .from("models")
          .select("endpoint_id, input_type")
          .eq("is_default", true)
          .eq("is_active", true)
          .single();

        if (defaultModel) {
          endpoint = defaultModel.endpoint_id;
          modelInputType = defaultModel.input_type;
        }
      } catch (e) {
        console.log("Could not fetch default model, using fallback:", e);
      }
    }

    const falHeaders = {
      Authorization: `Key ${FAL_AI_API_KEY}`,
      "Content-Type": "application/json",
    };

    // Build the payload based on input type
    const payload: Record<string, unknown> = {
      prompt,
      num_images: num_images || 1,
      enable_safety_checker: true,
    };

    if (modelInputType === "aspect_ratio") {
      payload.aspect_ratio = aspect_ratio || "1:1";
    } else {
      // image_size type
      if (image_size) {
        payload.image_size = image_size;
      } else if (aspect_ratio) {
        payload.image_size = RATIO_TO_IMAGE_SIZE[aspect_ratio] || "square_hd";
      } else {
        payload.image_size = "square_hd";
      }
    }

    // Some models have specific params
    if (endpoint === "fal-ai/flux/schnell") {
      payload.num_inference_steps = 4;
    }

    console.log(`Submitting to fal.ai [${endpoint}]:`, { prompt: prompt.slice(0, 80), ...payload });

    // Submit to queue
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
      // Direct response (no queue)
      return new Response(JSON.stringify(submitData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Poll for completion (max ~60s)
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await fetch(status_url, { headers: falHeaders });
      const statusData = await statusRes.json();
      console.log("Poll attempt", i + 1, "status:", statusData.status);

      if (statusData.status === "COMPLETED") {
        const resultRes = await fetch(response_url, { headers: falHeaders });
        const resultData = await resultRes.json();
        console.log("Generation complete, images:", resultData.images?.length);
        return new Response(JSON.stringify({ ...resultData, model_used: endpoint }), {
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
