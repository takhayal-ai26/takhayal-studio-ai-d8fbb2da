import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import {
  getPaymentProviderName,
  normalizePaymentWebhook,
  PaymentProviderNotConfiguredError,
} from "../_shared/payment-provider.ts";

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "Webhook service is not configured" }, 500);
  }

  const provider = getPaymentProviderName();
  const webhookSecret = Deno.env.get("PAYMENT_WEBHOOK_SECRET");
  if (provider === "manual" && webhookSecret) {
    const provided = req.headers.get("x-payment-webhook-secret");
    if (provided !== webhookSecret) return jsonResponse({ error: "Unauthorized webhook" }, 401);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const event = await normalizePaymentWebhook(provider, req);

    const { data: paymentEvent, error: eventError } = await admin
      .from("payment_events")
      .upsert({
        provider,
        provider_event_id: event.providerEventId,
        event_type: event.eventType,
        order_id: event.orderId || null,
        payload: event.rawPayload,
      }, { onConflict: "provider,provider_event_id" })
      .select("*")
      .single();

    if (eventError || !paymentEvent) {
      console.error("payment event insert failed:", eventError);
      return jsonResponse({ error: "Could not record webhook" }, 500);
    }

    if (!event.orderId) {
      await admin
        .from("payment_events")
        .update({ processed_at: new Date().toISOString(), error_message: "missing_order_id" })
        .eq("id", paymentEvent.id);
      return jsonResponse({ received: true, processed: false, reason: "missing_order_id" });
    }

    if (event.status) {
      const updatePayload: Record<string, unknown> = {
        status: event.status,
        provider_payload: event.rawPayload,
      };
      if (event.providerPaymentId) updatePayload.provider_payment_id = event.providerPaymentId;
      if (event.providerSubscriptionId) updatePayload.provider_subscription_id = event.providerSubscriptionId;
      if (event.status === "paid") updatePayload.paid_at = new Date().toISOString();

      await admin.from("payment_orders").update(updatePayload).eq("id", event.orderId);
    }

    let fulfillment: unknown = null;
    if (event.status === "paid") {
      const { data, error } = await admin.rpc("fulfill_payment_order", { p_order_id: event.orderId });
      if (error) throw error;
      fulfillment = data;
    }

    await admin
      .from("payment_events")
      .update({ processed_at: new Date().toISOString() })
      .eq("id", paymentEvent.id);

    return jsonResponse({ received: true, processed: true, fulfillment });
  } catch (err) {
    if (err instanceof PaymentProviderNotConfiguredError) {
      return jsonResponse({
        received: false,
        error: "payment_gateway_not_configured",
        message: "Webhook normalization is waiting for the payment gateway documentation.",
        provider,
      }, 501);
    }

    console.error("payment-webhook error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
