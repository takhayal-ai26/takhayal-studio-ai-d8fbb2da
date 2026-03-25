import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    const { provider_name } = await req.json();

    if (!provider_name) {
      return new Response(
        JSON.stringify({ error: "provider_name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let health = "down";
    let latency = 0;
    let details = "";

    if (provider_name === "Fal.ai") {
      const FAL_AI_API_KEY = Deno.env.get("FAL_AI_API_KEY");
      if (!FAL_AI_API_KEY) {
        return new Response(
          JSON.stringify({ health: "down", details: "FAL_AI_API_KEY not configured", latency: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const start = Date.now();
      try {
        // Quick test: submit a minimal request to check connectivity
        const res = await fetch("https://queue.fal.run/fal-ai/flux/schnell", {
          method: "POST",
          headers: {
            Authorization: `Key ${FAL_AI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: "health check test",
            image_size: "square",
            num_images: 1,
            num_inference_steps: 1,
          }),
        });
        latency = Date.now() - start;

        if (res.ok || res.status === 200 || res.status === 201) {
          health = "healthy";
          details = `API responding (${latency}ms)`;
          // Cancel the generation - we just needed to verify connectivity
          const data = await res.json();
          if (data.status_url) {
            // It queued successfully - that means API is healthy
            health = "healthy";
            details = `Queue accepting requests (${latency}ms)`;
          }
        } else if (res.status === 401 || res.status === 403) {
          health = "degraded";
          details = "Authentication failed - check API key";
        } else if (res.status === 429) {
          health = "degraded";
          details = "Rate limited";
        } else {
          health = "degraded";
          details = `Unexpected status: ${res.status}`;
        }
      } catch (fetchErr) {
        latency = Date.now() - start;
        health = "down";
        details = `Connection failed: ${fetchErr instanceof Error ? fetchErr.message : "Unknown"}`;
      }
    } else {
      health = "down";
      details = "Provider not configured";
    }

    // Update the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase
      .from("provider_configs")
      .update({
        health_status: health,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("provider_name", provider_name);

    return new Response(
      JSON.stringify({ health, latency, details, synced_at: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-provider-health error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
