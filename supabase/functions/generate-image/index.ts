import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_AI_API_KEY = Deno.env.get("FAL_AI_API_KEY");
    if (!FAL_AI_API_KEY) {
      throw new Error("FAL_AI_API_KEY is not configured");
    }

    const { prompt, image_size, num_images } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const falHeaders = {
      Authorization: `Key ${FAL_AI_API_KEY}`,
      "Content-Type": "application/json",
    };

    console.log("Submitting to fal.ai Flux Schnell:", { prompt, image_size, num_images });

    // Submit to queue
    const submitRes = await fetch("https://queue.fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: falHeaders,
      body: JSON.stringify({
        prompt,
        image_size: image_size || "square_hd",
        num_images: num_images || 4,
        num_inference_steps: 4,
        enable_safety_checker: true,
      }),
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      console.error("fal.ai submit error:", submitRes.status, errorText);
      return new Response(
        JSON.stringify({ error: `fal.ai API error: ${submitRes.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const submitData = await submitRes.json();
    const { status_url, response_url } = submitData;

    if (!status_url || !response_url) {
      // Direct response (no queue)
      console.log("Direct response, images:", submitData.images?.length);
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
        // Fetch the result
        const resultRes = await fetch(response_url, { headers: falHeaders });
        const resultData = await resultRes.json();
        console.log("Generation complete, images:", resultData.images?.length);
        return new Response(JSON.stringify(resultData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (statusData.status === "FAILED") {
        console.error("fal.ai generation failed:", statusData);
        return new Response(
          JSON.stringify({ error: "Image generation failed" }),
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
