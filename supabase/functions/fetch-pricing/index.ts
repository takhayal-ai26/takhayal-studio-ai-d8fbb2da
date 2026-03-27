import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const FAL_AI_API_KEY = Deno.env.get("FAL_AI_API_KEY");
  if (!FAL_AI_API_KEY) {
    return new Response(JSON.stringify({ error: "FAL_AI_API_KEY not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // All active model endpoints
  const endpoints = [
    "fal-ai/flux/schnell",
    "fal-ai/flux-pro/v1.1",
    "fal-ai/gpt-image-1.5",
    "fal-ai/ideogram/v3",
    "fal-ai/imagen4/preview",
    "fal-ai/nano-banana-2",
    "fal-ai/nano-banana-pro",
    "fal-ai/qwen-image",
    "fal-ai/flux/dev",
    "fal-ai/flux-pro/v1.1-ultra",
    "fal-ai/recraft-v3",
    "fal-ai/stable-diffusion-v35-large",
    "fal-ai/aura-flow",
    "fal-ai/minimax/image-01",
    "fal-ai/esrgan",
  ];

  const qs = endpoints.map(e => `endpoint_ids=${encodeURIComponent(e)}`).join("&");
  const url = `https://api.fal.ai/v1/models/pricing?${qs}`;

  const res = await fetch(url, {
    headers: { Authorization: `Key ${FAL_AI_API_KEY}` },
  });

  const data = await res.json();

  return new Response(JSON.stringify(data, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
