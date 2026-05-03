import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CREDIT_VALUE_USD = 0.016;

function getImageResultUrl(resultData: any): string | null {
  return resultData?.images?.[0]?.url
    || resultData?.image?.url
    || resultData?.output?.url
    || (typeof resultData?.output === "string" ? resultData.output : null)
    || (Array.isArray(resultData?.output) ? resultData.output[0]?.url || resultData.output[0] : null)
    || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const jobId = url.searchParams.get("job_id");
  const secret = url.searchParams.get("secret");
  const expectedSecret = Deno.env.get("FAL_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!expectedSecret || secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized webhook" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!jobId || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Webhook configuration missing" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payload = await req.json().catch(() => null);
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: existing } = await supabase
    .from("generation_logs")
    .select("credits_used, actual_api_cost, generation_cost")
    .eq("id", jobId)
    .single();

  const status = String(payload?.status || "").toUpperCase();
  if (status && status !== "OK") {
    const message = payload?.error
      || payload?.message
      || payload?.detail
      || JSON.stringify(payload).slice(0, 1000);

    await supabase.from("generation_logs").update({
      status: "failed",
      error_message: message,
    }).eq("id", jobId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const resultData = payload?.payload || payload?.response || payload?.data || payload;
  const imageResultUrl = getImageResultUrl(resultData);

  if (!imageResultUrl) {
    await supabase.from("generation_logs").update({
      status: "failed",
      error_message: "No image URL found in fal webhook response.",
    }).eq("id", jobId);

    return new Response(JSON.stringify({ ok: true, missing_image: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const creditsUsed = Number(existing?.credits_used ?? 0);
  const totalCost = Number(existing?.actual_api_cost ?? existing?.generation_cost ?? 0);
  const revenueUsd = creditsUsed * CREDIT_VALUE_USD;
  const profitUsd = revenueUsd - totalCost;
  const marginPct = revenueUsd > 0 ? (profitUsd / revenueUsd) * 100 : 0;

  await supabase.from("generation_logs").update({
    image_url: imageResultUrl,
    provider_cost: totalCost,
    revenue: revenueUsd,
    margin: profitUsd,
    revenue_usd: revenueUsd,
    profit_usd: profitUsd,
    margin_pct: marginPct,
    error_message: null,
    status: "completed",
  }).eq("id", jobId);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
