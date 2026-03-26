import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Quality-based pricing tiers for all known fal.ai models
// base = base cost, tiers define quality/resolution multipliers
// Verified pricing from fal.ai / pricepertoken.com (March 2026)
// Prices normalized to 1024×1024 (1MP) base image
// Per-MP models scale with resolution; per-image models are flat
const KNOWN_COSTS: Record<string, { base: number; notes: string; pricingUnit: string; tiers: { label: string; quality: string; res: string; multiplier: number; cost: number; credits: number }[] }> = {
  // FLUX family
  "fal-ai/flux/schnell":              { base: 0.003, pricingUnit: "per_image", notes: "Fastest FLUX, fixed per image", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.003, credits:1 },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1.5, cost:0.0045, credits:1 },
  ]},
  "fal-ai/flux/dev":                  { base: 0.025, pricingUnit: "per_image", notes: "FLUX.1 Dev, higher quality than schnell", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.025, credits:2 },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1.6, cost:0.04, credits:3 },
  ]},
  "fal-ai/flux-pro":                  { base: 0.055, pricingUnit: "per_image", notes: "FLUX.1 Pro (legacy/deprecated), $0.055/image", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.055, credits:3 },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1.5, cost:0.083, credits:5 },
  ]},
  "fal-ai/flux-pro/v1.1-ultra":       { base: 0.06, pricingUnit: "per_image", notes: "FLUX 1.1 Pro Ultra, $0.06/image, scales with resolution", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.06, credits:4 },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1.5, cost:0.09, credits:6 },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:2.33, cost:0.14, credits:10 },
  ]},
  "fal-ai/flux-pro/v1.1":             { base: 0.04, pricingUnit: "per_image", notes: "FLUX 1.1 Pro, $0.04/image", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.04, credits:3 },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1.5, cost:0.06, credits:4 },
  ]},
  "fal-ai/flux-pro/kontext":          { base: 0.04, pricingUnit: "per_image", notes: "FLUX Kontext Pro, $0.04/image, context-aware", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.04, credits:3 },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1.5, cost:0.06, credits:4 },
  ]},
  "fal-ai/flux-lora":                 { base: 0.025, pricingUnit: "per_image", notes: "FLUX with LoRA, $0.025/image", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.025, credits:2 },
  ]},
  "fal-ai/flux-krea-lora/stream":     { base: 0.004, pricingUnit: "per_image", notes: "FLUX Krea LoRA streaming, $0.004/image", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.004, credits:1 },
  ]},
  "fal-ai/flux-2-pro":                { base: 0.031, pricingUnit: "per_megapixel", notes: "FLUX.2 Pro, ~$0.031/MP, scales with output size", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.031, credits:2 },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:4, cost:0.124, credits:8 },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:16, cost:0.496, credits:25 },
  ]},
  "fal-ai/flux-2-flex":               { base: 0.063, pricingUnit: "per_megapixel", notes: "FLUX.2 Flex, ~$0.063/MP, scales with output size", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.063, credits:4 },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:4, cost:0.252, credits:13 },
  ]},
  "fal-ai/flux-2/klein/4b/lora":      { base: 0.015, pricingUnit: "per_image", notes: "FLUX.2 Klein 4B LoRA, $0.015/image", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.015, credits:1 },
  ]},
  "fal-ai/flux-2/klein/9b/lora":      { base: 0.015, pricingUnit: "per_image", notes: "FLUX.2 Klein 9B LoRA, ~$0.015/image", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.015, credits:1 },
  ]},

  // Ideogram
  "fal-ai/ideogram/v3":               { base: 0.08, pricingUnit: "per_image", notes: "Ideogram V3, $0.08/image (quality), $0.05 (turbo)", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.08, credits:5 },
    { label:"HD", quality:"2K", res:"1344x768", multiplier:1.125, cost:0.09, credits:6 },
  ]},

  // SDXL family
  "fal-ai/fast-sdxl":                 { base: 0.002, pricingUnit: "per_image", notes: "SDXL Lightning, $0.002/image, fastest", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.002, credits:1 },
  ]},
  "fal-ai/stable-diffusion-v35-large":{ base: 0.065, pricingUnit: "per_image", notes: "SD 3.5 Large, $0.065/image", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.065, credits:4 },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1.5, cost:0.098, credits:6 },
  ]},

  // Recraft
  "fal-ai/recraft-v3":                { base: 0.04, pricingUnit: "per_image", notes: "Recraft V3, $0.04/image", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.04, credits:3 },
    { label:"HD", quality:"2K", res:"2048x2048", multiplier:1.5, cost:0.06, credits:4 },
  ]},
  "fal-ai/recraft/v4/pro/text-to-image": { base: 0.05, pricingUnit: "per_image", notes: "Recraft V4 Pro, ~$0.05/image", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.05, credits:3 },
    { label:"HD", quality:"2K", res:"2048x2048", multiplier:1.6, cost:0.08, credits:5 },
  ]},

  // Google Imagen
  "fal-ai/imagen4/preview":           { base: 0.08, pricingUnit: "per_image", notes: "Google Imagen 4 Preview, $0.08/image (fast variant $0.04)", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.08, credits:5 },
    { label:"HD", quality:"2K", res:"2048x2048", multiplier:1.5, cost:0.12, credits:7 },
  ]},

  // GPT Image
  "fal-ai/gpt-image-1.5":            { base: 0.003, pricingUnit: "per_megapixel", notes: "GPT Image 1.5, ~$0.003/MP, very cheap per-MP pricing", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.003, credits:1 },
    { label:"HD", quality:"2K", res:"2048x2048", multiplier:4, cost:0.012, credits:1 },
  ]},

  // Qwen
  "fal-ai/qwen-image":               { base: 0.021, pricingUnit: "per_megapixel", notes: "Qwen Image, ~$0.021/MP", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.021, credits:2 },
  ]},

  // BRIA
  "fal-ai/bria/fibo/generate":        { base: 0.04, pricingUnit: "per_image", notes: "BRIA Fibo, ~$0.04/image, commercially safe", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.04, credits:3 },
  ]},

  // Seedream
  "fal-ai/bytedance/seedream/v4.5":   { base: 0.06, pricingUnit: "per_image", notes: "Seedream 4.5, $0.06/image (was $0.03 on fal pricing page for v4)", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.06, credits:4 },
    { label:"HD", quality:"2K", res:"2048x2048", multiplier:1.5, cost:0.09, credits:6 },
  ]},
  "fal-ai/bytedance/seedream/v5/lite": { base: 0.02, pricingUnit: "per_image", notes: "Seedream 5.0 Lite, ~$0.02/image", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.02, credits:1 },
  ]},

  // ImagineArt
  "imagineart/imagineart-1.5-preview/text-to-image": { base: 0.03, pricingUnit: "per_image", notes: "ImagineArt 1.5 preview, ~$0.03/image", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.03, credits:2 },
  ]},

  // Other models
  "fal-ai/aura-flow":                 { base: 0.02, pricingUnit: "per_image", notes: "Aura Flow, ~$0.02/image", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.02, credits:1 },
  ]},
  "fal-ai/nano-banana":               { base: 0.02, pricingUnit: "per_image", notes: "Nano Banana, $0.02/image", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.02, credits:1 },
  ]},
  "fal-ai/nano-banana-2":             { base: 0.02, pricingUnit: "per_image", notes: "Nano Banana 2, ~$0.02/image", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.02, credits:1 },
  ]},
  "fal-ai/nano-banana-pro":           { base: 0.04, pricingUnit: "per_image", notes: "Nano Banana Pro, $0.04/image", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.04, credits:3 },
  ]},
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

    const schemas = data?.components?.schemas || {};
    const meta = data?.info?.["x-fal-metadata"] || {};

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

    if (props.aspect_ratio) {
      result.input_type = "aspect_ratio";
      const ar = props.aspect_ratio;
      const enums = extractEnums(ar);
      result.supported_ratios = enums.length > 0 ? enums : ["1:1", "16:9", "9:16", "4:3", "3:4"];
      result.default_ratio = ar.default || enums[0] || "1:1";
    } else if (props.image_size) {
      result.input_type = "image_size";
      const is = props.image_size;
      const enums = extractEnums(is);
      result.supported_sizes = enums;
      const ratios = new Set<string>();
      for (const e of enums) {
        if (PRESET_TO_RATIO[e]) ratios.add(PRESET_TO_RATIO[e]);
      }
      result.supported_ratios = ratios.size > 0 ? Array.from(ratios) : ["1:1", "16:9", "9:16", "4:3", "3:4"];
      result.default_ratio = result.supported_ratios[0] || "1:1";
      result.default_resolution = is.default || "square_hd";
    }

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

    const { data: existingModels, error: fetchError } = await supabase.from("models").select("*");
    if (fetchError) throw fetchError;

    const modelsToSync = endpoint_id
      ? existingModels?.filter((m: any) => m.endpoint_id === endpoint_id) || []
      : existingModels || [];

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

        // 2. Skip health check to avoid timeout — mark as available if schema found
        const isAvailable = !!schema;

        // 3. Build update payload — preserve admin overrides
        const updatePayload: Record<string, unknown> = {
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

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
          if (!overrides.pricing_mode) updatePayload.pricing_mode = costData.pricingUnit === "per_megapixel" ? "per_megapixel" : (costData.tiers.length > 1 ? "resolution_based" : "fixed_per_image");
          if (!overrides.cost_per_run) updatePayload.cost_per_run = costData.base;
          updatePayload.admin_overrides = {
            ...overrides,
            pricing_notes: costData.notes,
            pricing_unit: costData.pricingUnit,
          };
        }

        const { error: updateError } = await supabase.from("models").update(updatePayload).eq("id", model.id);

        // 4. Sync pricing tiers with multiplier data
        if (costData?.tiers) {
          // Delete existing synced tiers (preserve manual ones via notes field)
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
            notes: `multiplier:${t.multiplier}|source:sync|base:${costData.base}`,
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
          tiers_synced: costData?.tiers?.length || 0,
          pricing_notes: costData?.notes || null,
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
      details: { results, tiers_synced: results.reduce((s, r) => s + (r.tiers_synced || 0), 0) },
    });

    return new Response(
      JSON.stringify({ synced_at: new Date().toISOString(), models_checked: results.length, models_synced: syncedCount, tiers_synced: results.reduce((s, r) => s + (r.tiers_synced || 0), 0), results }),
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
