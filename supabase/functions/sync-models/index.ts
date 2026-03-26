import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Known fal.ai model pricing tiers (fal doesn't expose a public pricing API, so we maintain known data)
const FAL_MODEL_META: Record<string, {
  pricing_mode: string;
  base_cost: number;
  tiers?: { label: string; quality?: string; resolution?: string; cost: number; credits: number }[];
}> = {
  "fal-ai/flux/schnell": {
    pricing_mode: "fixed_per_image",
    base_cost: 0.003,
    tiers: [
      { label: "1K Standard", quality: "1K", resolution: "1024x1024", cost: 0.003, credits: 1 },
      { label: "2K HD", quality: "2K", resolution: "2048x2048", cost: 0.005, credits: 2 },
    ],
  },
  "fal-ai/flux/dev": {
    pricing_mode: "fixed_per_image",
    base_cost: 0.025,
    tiers: [
      { label: "1K Standard", quality: "1K", resolution: "1024x1024", cost: 0.025, credits: 2 },
      { label: "2K HD", quality: "2K", resolution: "2048x2048", cost: 0.04, credits: 4 },
    ],
  },
  "fal-ai/flux-pro": {
    pricing_mode: "fixed_per_image",
    base_cost: 0.05,
    tiers: [
      { label: "1K Standard", quality: "1K", resolution: "1024x1024", cost: 0.05, credits: 3 },
      { label: "2K HD", quality: "2K", resolution: "2048x2048", cost: 0.07, credits: 5 },
    ],
  },
  "fal-ai/flux-pro/v1.1-ultra": {
    pricing_mode: "resolution_based",
    base_cost: 0.06,
    tiers: [
      { label: "1K Standard", quality: "1K", resolution: "1024x1024", cost: 0.06, credits: 4 },
      { label: "2K HD", quality: "2K", resolution: "2048x2048", cost: 0.09, credits: 6 },
      { label: "4K Ultra", quality: "4K", resolution: "4096x4096", cost: 0.14, credits: 10 },
    ],
  },
  "fal-ai/ideogram/v3": {
    pricing_mode: "fixed_per_image",
    base_cost: 0.08,
    tiers: [
      { label: "Standard", quality: "1K", resolution: "1024x1024", cost: 0.08, credits: 4 },
      { label: "HD", quality: "2K", resolution: "1344x768", cost: 0.10, credits: 6 },
    ],
  },
  "fal-ai/fast-sdxl": {
    pricing_mode: "fixed_per_image",
    base_cost: 0.002,
    tiers: [
      { label: "Standard", quality: "1K", resolution: "1024x1024", cost: 0.002, credits: 1 },
    ],
  },
  "fal-ai/stable-diffusion-v35-large": {
    pricing_mode: "fixed_per_image",
    base_cost: 0.035,
    tiers: [
      { label: "1K Standard", quality: "1K", resolution: "1024x1024", cost: 0.035, credits: 2 },
      { label: "2K HD", quality: "2K", resolution: "2048x2048", cost: 0.05, credits: 4 },
    ],
  },
  "fal-ai/aura-flow": {
    pricing_mode: "fixed_per_image",
    base_cost: 0.02,
    tiers: [
      { label: "Standard", quality: "1K", resolution: "1024x1024", cost: 0.02, credits: 2 },
    ],
  },
  "fal-ai/recraft-v3": {
    pricing_mode: "fixed_per_image",
    base_cost: 0.04,
    tiers: [
      { label: "Standard", quality: "1K", resolution: "1024x1024", cost: 0.04, credits: 3 },
      { label: "HD", quality: "2K", resolution: "2048x2048", cost: 0.06, credits: 5 },
    ],
  },
  "fal-ai/imagen4/preview": {
    pricing_mode: "fixed_per_image",
    base_cost: 0.04,
    tiers: [
      { label: "Standard", quality: "1K", resolution: "1024x1024", cost: 0.04, credits: 2 },
      { label: "HD", quality: "2K", resolution: "2048x2048", cost: 0.06, credits: 4 },
    ],
  },
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
    let syncedCount = 0;
    const errors: string[] = [];

    // Find fal provider for sync log
    const { data: falProvider } = await supabase
      .from("provider_configs")
      .select("id")
      .eq("provider_name", "Fal.ai")
      .single();

    for (const model of modelsToSync) {
      try {
        // Ping the fal.ai endpoint
        const healthRes = await fetch(`https://fal.run/${model.endpoint_id}`, {
          method: "POST",
          headers: {
            Authorization: `Key ${FAL_AI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: "test",
            image_size: "square",
            num_images: 0,
          }),
        });

        const isAvailable = healthRes.status < 500;
        const overrides = (model.admin_overrides as Record<string, unknown>) || {};

        // Build update payload — preserve admin_overrides
        const updatePayload: Record<string, unknown> = {
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Update pricing_mode from known data if not overridden
        const meta = FAL_MODEL_META[model.endpoint_id];
        if (meta) {
          if (!overrides.pricing_mode) updatePayload.pricing_mode = meta.pricing_mode;
          if (!overrides.cost_per_run) updatePayload.cost_per_run = meta.base_cost;
        }

        const { error: updateError } = await supabase
          .from("models")
          .update(updatePayload)
          .eq("id", model.id);

        // Sync pricing tiers if we have known data and admin hasn't overridden
        if (meta?.tiers && !overrides.pricing_tiers) {
          // Delete existing non-overridden tiers, then insert fresh
          await supabase
            .from("model_pricing_tiers")
            .delete()
            .eq("model_id", model.id);

          const tierRows = meta.tiers.map((t) => ({
            model_id: model.id,
            tier_label: t.label,
            quality_level: t.quality || null,
            resolution_key: t.resolution || null,
            cost_per_run: t.cost,
            credits_charged: t.credits,
            pricing_mode: meta.pricing_mode,
            is_default: t === meta.tiers![0],
          }));

          await supabase.from("model_pricing_tiers").insert(tierRows);
        }

        if (!updateError) syncedCount++;

        results.push({
          endpoint_id: model.endpoint_id,
          model_name: model.model_name,
          status: isAvailable ? "available" : "unavailable",
          synced: !updateError,
          http_status: healthRes.status,
          tiers_synced: meta?.tiers?.length || 0,
        });
      } catch (err) {
        errors.push(`${model.endpoint_id}: ${String(err)}`);
        results.push({
          endpoint_id: model.endpoint_id,
          model_name: model.model_name,
          status: "error",
          error: String(err),
        });
      }
    }

    // Log sync event
    await supabase.from("pricing_sync_logs").insert({
      provider_id: falProvider?.id || null,
      provider_name: "Fal.ai",
      sync_status: errors.length === 0 ? "success" : errors.length < modelsToSync.length ? "partial" : "failed",
      synced_models_count: syncedCount,
      error_message: errors.length > 0 ? errors.join("; ") : null,
      details: { results },
    });

    return new Response(
      JSON.stringify({
        synced_at: new Date().toISOString(),
        models_checked: results.length,
        models_synced: syncedCount,
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
