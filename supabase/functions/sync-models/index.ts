import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Known fal.ai model metadata that we can enrich from their API
const FAL_PRICING_ENDPOINTS: Record<string, string> = {
  "fal-ai/flux/schnell": "https://fal.run/fal-ai/flux/schnell",
  "fal-ai/flux/dev": "https://fal.run/fal-ai/flux/dev",
  "fal-ai/flux-pro": "https://fal.run/fal-ai/flux-pro",
  "fal-ai/flux-pro/v1.1-ultra": "https://fal.run/fal-ai/flux-pro/v1.1-ultra",
  "fal-ai/ideogram/v3": "https://fal.run/fal-ai/ideogram/v3",
  "fal-ai/fast-sdxl": "https://fal.run/fal-ai/fast-sdxl",
  "fal-ai/stable-diffusion-v35-large": "https://fal.run/fal-ai/stable-diffusion-v35-large",
  "fal-ai/aura-flow": "https://fal.run/fal-ai/aura-flow",
  "fal-ai/recraft-v3": "https://fal.run/fal-ai/recraft-v3",
  "fal-ai/imagen4/preview": "https://fal.run/fal-ai/imagen4/preview",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_AI_API_KEY = Deno.env.get("FAL_AI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FAL_AI_API_KEY) throw new Error("FAL_AI_API_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase env not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { endpoint_id } = await req.json().catch(() => ({ endpoint_id: null }));

    // Fetch existing models from DB
    const { data: existingModels, error: fetchError } = await supabase
      .from("models")
      .select("*");

    if (fetchError) throw fetchError;

    const modelsToSync = endpoint_id
      ? existingModels?.filter((m: any) => m.endpoint_id === endpoint_id) || []
      : existingModels || [];

    const results: any[] = [];

    for (const model of modelsToSync) {
      try {
        // Try to ping the fal.ai endpoint to check availability
        const healthRes = await fetch(`https://fal.run/${model.endpoint_id}`, {
          method: "POST",
          headers: {
            Authorization: `Key ${FAL_AI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: "test",
            image_size: "square",
            num_images: 0, // Don't actually generate
          }),
        });

        // Even if it errors (expected with num_images: 0), a non-5xx means the endpoint exists
        const isAvailable = healthRes.status < 500;

        // Build update payload — preserve admin_overrides
        const updatePayload: Record<string, unknown> = {
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Only update fields NOT in admin_overrides
        const overrides = (model.admin_overrides as Record<string, unknown>) || {};

        // If admin hasn't overridden cost, we could update from fal pricing API
        // For now, fal doesn't expose a public pricing API, so we keep admin values
        // But we mark synced status
        if (!overrides.speed) {
          // Speed could be checked via actual generation timing, but skip for now
        }

        const { error: updateError } = await supabase
          .from("models")
          .update(updatePayload)
          .eq("id", model.id);

        results.push({
          endpoint_id: model.endpoint_id,
          model_name: model.model_name,
          status: isAvailable ? "available" : "unavailable",
          synced: !updateError,
          http_status: healthRes.status,
        });
      } catch (err) {
        results.push({
          endpoint_id: model.endpoint_id,
          model_name: model.model_name,
          status: "error",
          error: String(err),
        });
      }
    }

    return new Response(
      JSON.stringify({
        synced_at: new Date().toISOString(),
        models_checked: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("sync-models error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
