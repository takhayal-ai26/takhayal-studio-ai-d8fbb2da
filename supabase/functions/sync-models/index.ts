import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Quality-based pricing tiers for all known fal.ai models
const KNOWN_COSTS: Record<string, { base: number; notes: string; pricingUnit: string; supportsNativeHighRes: boolean; tiers: { label: string; quality: string; res: string; multiplier: number; cost: number; credits: number; usesUpscale: boolean }[] }> = {
  "fal-ai/flux/schnell":              { base: 0.003, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "Fastest FLUX, fixed per image", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.003, credits:1, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.004, credits:2, usesUpscale:true },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:1, cost:0.006, credits:4, usesUpscale:true },
  ]},
  "fal-ai/flux/dev":                  { base: 0.025, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "FLUX.1 Dev, higher quality than schnell", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.025, credits:2, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.026, credits:3, usesUpscale:true },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:1, cost:0.028, credits:5, usesUpscale:true },
  ]},
  "fal-ai/flux-pro":                  { base: 0.055, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "FLUX.1 Pro (legacy)", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.055, credits:3, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.056, credits:4, usesUpscale:true },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:1, cost:0.058, credits:6, usesUpscale:true },
  ]},
  "fal-ai/flux-pro/v1.1-ultra":       { base: 0.06, pricingUnit: "per_image", supportsNativeHighRes: true, notes: "FLUX 1.1 Pro Ultra, scales with resolution natively", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.06, credits:4, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1.5, cost:0.09, credits:6, usesUpscale:false },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:2.33, cost:0.14, credits:10, usesUpscale:false },
  ]},
  "fal-ai/flux-pro/v1.1":             { base: 0.04, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "FLUX 1.1 Pro", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.04, credits:3, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.041, credits:4, usesUpscale:true },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:1, cost:0.043, credits:6, usesUpscale:true },
  ]},
  "fal-ai/flux-pro/kontext":          { base: 0.04, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "FLUX Kontext Pro, context-aware", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.04, credits:3, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.041, credits:4, usesUpscale:true },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:1, cost:0.043, credits:6, usesUpscale:true },
  ]},
  "fal-ai/flux-lora":                 { base: 0.025, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "FLUX with LoRA", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.025, credits:2, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.026, credits:3, usesUpscale:true },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:1, cost:0.028, credits:5, usesUpscale:true },
  ]},
  "fal-ai/flux-krea-lora/stream":     { base: 0.004, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "FLUX Krea LoRA streaming", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.004, credits:1, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.005, credits:2, usesUpscale:true },
  ]},
  "fal-ai/flux-2-pro":                { base: 0.031, pricingUnit: "per_megapixel", supportsNativeHighRes: true, notes: "FLUX.2 Pro, ~$0.031/MP, scales with output size", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.031, credits:2, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:4, cost:0.124, credits:8, usesUpscale:false },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:16, cost:0.496, credits:25, usesUpscale:false },
  ]},
  "fal-ai/flux-2-flex":               { base: 0.063, pricingUnit: "per_megapixel", supportsNativeHighRes: false, notes: "FLUX.2 Flex, ~$0.063/MP", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.063, credits:4, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:4, cost:0.252, credits:13, usesUpscale:false },
  ]},
  "fal-ai/flux-2/klein/4b/lora":      { base: 0.015, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "FLUX.2 Klein 4B LoRA", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.015, credits:1, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.016, credits:2, usesUpscale:true },
  ]},
  "fal-ai/flux-2/klein/9b/lora":      { base: 0.015, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "FLUX.2 Klein 9B LoRA", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.015, credits:1, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.016, credits:2, usesUpscale:true },
  ]},
  "fal-ai/ideogram/v3":               { base: 0.08, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "Ideogram V3", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.08, credits:5, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.081, credits:6, usesUpscale:true },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:1, cost:0.083, credits:8, usesUpscale:true },
  ]},
  "fal-ai/fast-sdxl":                 { base: 0.002, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "SDXL Lightning, fastest", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.002, credits:1, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.003, credits:2, usesUpscale:true },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:1, cost:0.005, credits:4, usesUpscale:true },
  ]},
  "fal-ai/stable-diffusion-v35-large":{ base: 0.065, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "SD 3.5 Large", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.065, credits:4, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.066, credits:5, usesUpscale:true },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:1, cost:0.068, credits:7, usesUpscale:true },
  ]},
  "fal-ai/recraft-v3":                { base: 0.04, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "Recraft V3", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.04, credits:3, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.041, credits:4, usesUpscale:true },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:1, cost:0.043, credits:6, usesUpscale:true },
  ]},
  "fal-ai/recraft/v4/pro/text-to-image": { base: 0.05, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "Recraft V4 Pro", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.05, credits:3, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.051, credits:4, usesUpscale:true },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:1, cost:0.053, credits:6, usesUpscale:true },
  ]},
  "fal-ai/imagen4/preview":           { base: 0.08, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "Google Imagen 4 Preview", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.08, credits:5, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.081, credits:6, usesUpscale:true },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:1, cost:0.083, credits:8, usesUpscale:true },
  ]},
  "fal-ai/gpt-image-1.5":            { base: 0.003, pricingUnit: "per_megapixel", supportsNativeHighRes: true, notes: "GPT Image 1.5, ~$0.003/MP", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.003, credits:1, usesUpscale:false },
    { label:"HD", quality:"2K", res:"1536x1024", multiplier:1.5, cost:0.005, credits:1, usesUpscale:false },
  ]},
  "fal-ai/qwen-image":               { base: 0.021, pricingUnit: "per_megapixel", supportsNativeHighRes: false, notes: "Qwen Image, ~$0.021/MP", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.021, credits:2, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.022, credits:3, usesUpscale:true },
  ]},
  "fal-ai/bria/fibo/generate":        { base: 0.04, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "BRIA Fibo, commercially safe", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.04, credits:3, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.041, credits:4, usesUpscale:true },
  ]},
  "fal-ai/bytedance/seedream/v4.5":   { base: 0.06, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "Seedream 4.5", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.06, credits:4, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.061, credits:5, usesUpscale:true },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:1, cost:0.063, credits:7, usesUpscale:true },
  ]},
  "fal-ai/bytedance/seedream/v5/lite": { base: 0.02, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "Seedream 5.0 Lite", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.02, credits:1, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.021, credits:2, usesUpscale:true },
  ]},
  "imagineart/imagineart-1.5-preview/text-to-image": { base: 0.03, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "ImagineArt 1.5 preview", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.03, credits:2, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.031, credits:3, usesUpscale:true },
  ]},
  "fal-ai/aura-flow":                 { base: 0.02, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "Aura Flow", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.02, credits:1, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.021, credits:2, usesUpscale:true },
  ]},
  "fal-ai/nano-banana":               { base: 0.02, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "Nano Banana", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.02, credits:1, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.021, credits:2, usesUpscale:true },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:1, cost:0.023, credits:4, usesUpscale:true },
  ]},
  "fal-ai/nano-banana-2":             { base: 0.02, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "Nano Banana 2", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.02, credits:1, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.021, credits:2, usesUpscale:true },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:1, cost:0.023, credits:4, usesUpscale:true },
  ]},
  "fal-ai/nano-banana-pro":           { base: 0.04, pricingUnit: "per_image", supportsNativeHighRes: false, notes: "Nano Banana Pro", tiers: [
    { label:"Standard", quality:"1K", res:"1024x1024", multiplier:1, cost:0.04, credits:3, usesUpscale:false },
    { label:"2K HD", quality:"2K", res:"2048x2048", multiplier:1, cost:0.041, credits:4, usesUpscale:true },
    { label:"4K Ultra", quality:"4K", res:"4096x4096", multiplier:1, cost:0.043, credits:6, usesUpscale:true },
  ]},
};

const PRESET_TO_RATIO: Record<string, string> = {
  "square_hd": "1:1", "square": "1:1",
  "portrait_4_3": "3:4", "portrait_16_9": "9:16",
  "landscape_4_3": "4:3", "landscape_16_9": "16:9",
};

interface SchemaCapabilities {
  input_type: "image_size" | "aspect_ratio";
  supported_ratios: string[];
  supported_sizes: string[];
  default_ratio: string | null;
  default_resolution: string | null;
}

async function fetchModelSchema(endpointId: string): Promise<SchemaCapabilities | null> {
  try {
    const res = await fetch(`https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=${endpointId}`);
    if (!res.ok) return null;
    const data = await res.json();
    const schemas = data?.components?.schemas || {};
    let inputSchema: any = null;
    for (const [name, s] of Object.entries(schemas)) {
      if ((name as string).endsWith("Input") && (s as any)?.properties?.prompt) { inputSchema = s; break; }
    }
    if (!inputSchema) return null;
    const props = inputSchema.properties || {};
    const result: SchemaCapabilities = { input_type: "image_size", supported_ratios: [], supported_sizes: [], default_ratio: null, default_resolution: null };

    if (props.aspect_ratio) {
      result.input_type = "aspect_ratio";
      const enums = extractEnums(props.aspect_ratio);
      result.supported_ratios = enums.length > 0 ? enums : ["1:1", "16:9", "9:16", "4:3", "3:4"];
      result.default_ratio = props.aspect_ratio.default || enums[0] || "1:1";
    } else if (props.image_size) {
      result.input_type = "image_size";
      const enums = extractEnums(props.image_size);
      result.supported_sizes = enums;
      const ratios = new Set<string>();
      for (const e of enums) { if (PRESET_TO_RATIO[e]) ratios.add(PRESET_TO_RATIO[e]); }
      result.supported_ratios = ratios.size > 0 ? Array.from(ratios) : ["1:1", "16:9", "9:16", "4:3", "3:4"];
      result.default_ratio = result.supported_ratios[0] || "1:1";
      result.default_resolution = props.image_size.default || "square_hd";
    }
    return result;
  } catch (e) {
    console.error(`Schema fetch failed for ${endpointId}:`, e);
    return null;
  }
}

function extractEnums(prop: any): string[] {
  if (prop.enum) return prop.enum;
  if (prop.anyOf) { for (const item of prop.anyOf) { if (item.enum) return item.enum; } }
  return [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const { data: falProvider } = await supabase.from("provider_configs").select("id").eq("provider_name", "Fal.ai").single();

    const results: any[] = [];
    let syncedCount = 0;
    const errors: string[] = [];

    for (const model of modelsToSync) {
      try {
        const overrides = (model.admin_overrides as Record<string, unknown>) || {};
        const schema = await fetchModelSchema(model.endpoint_id);
        const isAvailable = !!schema;

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

        const costData = KNOWN_COSTS[model.endpoint_id];
        if (costData) {
          if (!overrides.pricing_mode) updatePayload.pricing_mode = costData.pricingUnit === "per_megapixel" ? "per_megapixel" : (costData.tiers.length > 1 ? "resolution_based" : "fixed_per_image");
          if (!overrides.cost_per_run) updatePayload.cost_per_run = costData.base;
          if (!overrides.supported_quality_tiers) {
            updatePayload.supported_quality_tiers = costData.tiers.map(t => t.quality);
          }
          if (!overrides.supports_native_high_res) {
            updatePayload.supports_native_high_res = costData.supportsNativeHighRes;
          }
          if (!overrides.upscale_strategy) {
            updatePayload.upscale_strategy = costData.supportsNativeHighRes ? "none" : "esrgan";
          }
          updatePayload.admin_overrides = {
            ...overrides,
            pricing_notes: costData.notes,
            pricing_unit: costData.pricingUnit,
          };
        }

        const { error: updateError } = await supabase.from("models").update(updatePayload).eq("id", model.id);

        // Sync pricing tiers
        if (costData?.tiers) {
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
            notes: `multiplier:${t.multiplier}|source:sync|base:${costData.base}|upscale:${t.usesUpscale}`,
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
          supports_native_high_res: costData?.supportsNativeHighRes || false,
          pricing_notes: costData?.notes || null,
        });
      } catch (err) {
        errors.push(`${model.endpoint_id}: ${String(err)}`);
        results.push({ endpoint_id: model.endpoint_id, model_name: model.model_name, status: "error", error: String(err) });
      }
    }

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
