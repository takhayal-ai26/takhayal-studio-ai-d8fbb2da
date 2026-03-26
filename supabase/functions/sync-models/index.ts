import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Known cost data (fal doesn't expose pricing in the API)
const KNOWN_COSTS: Record<string, { base: number; tiers: { label: string; quality: string; res: string; cost: number; credits: number }[] }> = {
  "fal-ai/flux/schnell":            { base: 0.003, tiers: [{ label:"1K", quality:"1K", res:"1024x1024", cost:0.003, credits:1 }, { label:"2K HD", quality:"2K", res:"2048x2048", cost:0.005, credits:2 }] },
  "fal-ai/flux/dev":                { base: 0.025, tiers: [{ label:"1K", quality:"1K", res:"1024x1024", cost:0.025, credits:2 }, { label:"2K HD", quality:"2K", res:"2048x2048", cost:0.04, credits:4 }] },
  "fal-ai/flux-pro":                { base: 0.05,  tiers: [{ label:"1K", quality:"1K", res:"1024x1024", cost:0.05, credits:3 }, { label:"2K HD", quality:"2K", res:"2048x2048", cost:0.07, credits:5 }] },
  "fal-ai/flux-pro/v1.1-ultra":     { base: 0.06,  tiers: [{ label:"1K", quality:"1K", res:"1024x1024", cost:0.06, credits:4 }, { label:"2K HD", quality:"2K", res:"2048x2048", cost:0.09, credits:6 }, { label:"4K Ultra", quality:"4K", res:"4096x4096", cost:0.14, credits:10 }] },
  "fal-ai/ideogram/v3":             { base: 0.08,  tiers: [{ label:"Standard", quality:"1K", res:"1024x1024", cost:0.08, credits:4 }, { label:"HD", quality:"2K", res:"1344x768", cost:0.10, credits:6 }] },
  "fal-ai/fast-sdxl":               { base: 0.002, tiers: [{ label:"Standard", quality:"1K", res:"1024x1024", cost:0.002, credits:1 }] },
  "fal-ai/stable-diffusion-v35-large": { base: 0.035, tiers: [{ label:"1K", quality:"1K", res:"1024x1024", cost:0.035, credits:2 }, { label:"2K HD", quality:"2K", res:"2048x2048", cost:0.05, credits:4 }] },
  "fal-ai/aura-flow":               { base: 0.02,  tiers: [{ label:"Standard", quality:"1K", res:"1024x1024", cost:0.02, credits:2 }] },
  "fal-ai/recraft-v3":              { base: 0.04,  tiers: [{ label:"Standard", quality:"1K", res:"1024x1024", cost:0.04, credits:3 }, { label:"HD", quality:"2K", res:"2048x2048", cost:0.06, credits:5 }] },
  "fal-ai/imagen4/preview":         { base: 0.04,  tiers: [{ label:"Standard", quality:"1K", res:"1024x1024", cost:0.04, credits:2 }, { label:"HD", quality:"2K", res:"2048x2048", cost:0.06, credits:4 }] },
  "fal-ai/nano-banana-2":           { base: 0.01,  tiers: [{ label:"Standard", quality:"1K", res:"1024x1024", cost:0.01, credits:1 }] },
  "fal-ai/nano-banana-pro":         { base: 0.02,  tiers: [{ label:"Standard", quality:"1K", res:"1024x1024", cost:0.02, credits:2 }] },
  "fal-ai/recraft-v4/pro":          { base: 0.05,  tiers: [{ label:"Standard", quality:"1K", res:"1024x1024", cost:0.05, credits:3 }] },
  "fal-ai/seedream-3.0":            { base: 0.03,  tiers: [{ label:"Standard", quality:"1K", res:"1024x1024", cost:0.03, credits:2 }] },
};

// Preset size → approx ratio
const PRESET_TO_RATIO: Record<string, string> = {
  "square_hd": "1:1",
  "square": "1:1",
  "portrait_4_3": "3:4",
  "portrait_16_9": "9:16",
  "landscape_4_3": "4:3",
  "landscape_16_9": "16:9",
};

interface SchemaCapabilities {
  input_type: "image_size" | "aspect_ratio";
  supported_ratios: string[];
  supported_sizes: string[];
  default_ratio: string | null;
  default_resolution: string | null;
  has_style: boolean;
  styles: string[];
  category: string | null;
}

async function fetchModelSchema(endpointId: string): Promise<SchemaCapabilities | null> {
  try {
    const res = await fetch(`https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=${endpointId}`);
    if (!res.ok) return null;
    const data = await res.json();

    const meta = data?.info?.["x-fal-metadata"] || {};
    const schemas = data?.components?.schemas || {};

    // Find the Input schema
    let inputSchema: any = null;
    for (const [name, s] of Object.entries(schemas)) {
      if ((name as string).endsWith("Input") && (s as any)?.properties?.prompt) {
        inputSchema = s;
        break;
      }
    }
    if (!inputSchema) return null;

    const props = inputSchema.properties || {};
    const result: SchemaCapabilities = {
      input_type: "image_size",
      supported_ratios: [],
      supported_sizes: [],
      default_ratio: null,
      default_resolution: null,
      has_style: false,
      styles: [],
      category: meta.category || null,
    };

    // Detect input type and extract supported values
    if (props.aspect_ratio) {
      result.input_type = "aspect_ratio";
      const ar = props.aspect_ratio;
      // Extract enum from anyOf or direct enum
      const enums = extractEnums(ar);
      result.supported_ratios = enums.length > 0 ? enums : ["1:1", "16:9", "9:16", "4:3", "3:4"];
      result.default_ratio = ar.default || enums[0] || "1:1";
    } else if (props.image_size) {
      result.input_type = "image_size";
      const is = props.image_size;
      const enums = extractEnums(is);
      result.supported_sizes = enums;
      // Convert preset enums to ratios
      const ratios = new Set<string>();
      for (const e of enums) {
        if (PRESET_TO_RATIO[e]) ratios.add(PRESET_TO_RATIO[e]);
      }
      if (ratios.size === 0) {
        result.supported_ratios = ["1:1", "16:9", "9:16", "4:3", "3:4"];
      } else {
        result.supported_ratios = Array.from(ratios);
      }
      result.default_ratio = result.supported_ratios[0] || "1:1";
      result.default_resolution = is.default || "square_hd";
    }

    // Check for style parameter
    if (props.style) {
      result.has_style = true;
      result.styles = extractEnums(props.style);
    }

    return result;
  } catch (e) {
    console.error(`Schema fetch failed for ${endpointId}:`, e);
    return null;
  }
}

function extractEnums(prop: any): string[] {
  if (prop.enum) return prop.enum;
  if (prop.anyOf) {
    for (const item of prop.anyOf) {
      if (item.enum) return item.enum;
    }
  }
  return [];
}

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

    // Fetch existing models
    const { data: existingModels, error: fetchError } = await supabase.from("models").select("*");
    if (fetchError) throw fetchError;

    const modelsToSync = endpoint_id
      ? existingModels?.filter((m: any) => m.endpoint_id === endpoint_id) || []
      : existingModels || [];

    // Find fal provider
    const { data: falProvider } = await supabase
      .from("provider_configs")
      .select("id")
      .eq("provider_name", "Fal.ai")
      .single();

    const results: any[] = [];
    let syncedCount = 0;
    const errors: string[] = [];

    for (const model of modelsToSync) {
      try {
        const overrides = (model.admin_overrides as Record<string, unknown>) || {};

        // 1. Fetch OpenAPI schema for capabilities
        const schema = await fetchModelSchema(model.endpoint_id);

        // 2. Health check
        let isAvailable = false;
        try {
          const healthRes = await fetch(`https://fal.run/${model.endpoint_id}`, {
            method: "POST",
            headers: { Authorization: `Key ${FAL_AI_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: "test", num_images: 0 }),
          });
          isAvailable = healthRes.status < 500;
        } catch { isAvailable = false; }

        // 3. Build update payload — preserve admin overrides
        const updatePayload: Record<string, unknown> = {
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Update from schema if available and not overridden
        if (schema) {
          if (!overrides.input_type) updatePayload.input_type = schema.input_type;
          if (!overrides.supported_ratios) updatePayload.supported_ratios = schema.supported_ratios;
          if (!overrides.supported_sizes) updatePayload.supported_sizes = schema.supported_sizes;
          if (!overrides.default_ratio && schema.default_ratio) updatePayload.default_ratio = schema.default_ratio;
          if (!overrides.default_resolution && schema.default_resolution) updatePayload.default_resolution = schema.default_resolution;
        }

        // Update cost from known data
        const costData = KNOWN_COSTS[model.endpoint_id];
        if (costData) {
          if (!overrides.pricing_mode) updatePayload.pricing_mode = costData.tiers.length > 1 ? "resolution_based" : "fixed_per_image";
          if (!overrides.cost_per_run) updatePayload.cost_per_run = costData.base;
        }

        const { error: updateError } = await supabase.from("models").update(updatePayload).eq("id", model.id);

        // 4. Sync pricing tiers
        if (costData?.tiers && !overrides.pricing_tiers) {
          await supabase.from("model_pricing_tiers").delete().eq("model_id", model.id);
          const tierRows = costData.tiers.map((t, i) => ({
            model_id: model.id,
            tier_label: t.label,
            quality_level: t.quality,
            resolution_key: t.res,
            cost_per_run: t.cost,
            credits_charged: t.credits,
            pricing_mode: costData.tiers.length > 1 ? "resolution_based" : "fixed_per_image",
            is_default: i === 0,
          }));
          await supabase.from("model_pricing_tiers").insert(tierRows);
        }

        if (!updateError) syncedCount++;

        results.push({
          endpoint_id: model.endpoint_id,
          model_name: model.model_name,
          status: isAvailable ? "available" : "unavailable",
          synced: !updateError,
          schema_found: !!schema,
          input_type: schema?.input_type || model.input_type,
          ratios: schema?.supported_ratios || [],
          sizes: schema?.supported_sizes || [],
          styles: schema?.styles || [],
          tiers_synced: costData?.tiers?.length || 0,
        });
      } catch (err) {
        errors.push(`${model.endpoint_id}: ${String(err)}`);
        results.push({ endpoint_id: model.endpoint_id, model_name: model.model_name, status: "error", error: String(err) });
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
      JSON.stringify({ synced_at: new Date().toISOString(), models_checked: results.length, models_synced: syncedCount, results }),
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
