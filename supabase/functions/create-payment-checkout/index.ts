import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import {
  createProviderCheckout,
  getPaymentProviderName,
  PaymentProviderNotConfiguredError,
} from "../_shared/payment-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type CheckoutBody = {
  product_type?: "subscription" | "credits";
  plan_slug?: string;
  billing_period?: "monthly" | "annual";
  credits?: number;
  success_url?: string;
  cancel_url?: string;
};

function buildIdempotencyKey(userId: string, body: CheckoutBody) {
  return [
    userId,
    body.product_type,
    body.plan_slug || "",
    body.billing_period || "",
    body.credits || 0,
    crypto.randomUUID(),
  ].join(":");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      return jsonResponse({ error: "Payment service is not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = (await req.json()) as CheckoutBody;
    const productType = body.product_type;
    if (productType !== "subscription" && productType !== "credits") {
      return jsonResponse({ error: "product_type must be subscription or credits" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const origin = req.headers.get("origin") || "https://takhayal.ai";
    const successUrl = body.success_url || `${origin}/checkout/success`;
    const cancelUrl = body.cancel_url || `${origin}/checkout`;
    const provider = getPaymentProviderName();

    if (provider === "pending") {
      return jsonResponse({
        success: false,
        error: "payment_gateway_not_configured",
        message: "Payment checkout is not available until a payment gateway provider is configured.",
        provider,
      }, 503);
    }

    let productId: string | null = null;
    let planSlug = "";
    let creditPackageId: string | null = null;
    let credits = 0;
    let amount = 0;
    let currency = "USD";
    let displayName = "";
    let billingPeriod: "monthly" | "annual" | null = null;

    if (productType === "subscription") {
      if (!body.plan_slug) return jsonResponse({ error: "plan_slug is required" }, 400);
      billingPeriod = body.billing_period === "annual" ? "annual" : "monthly";
      const { data: plan, error } = await admin
        .from("pricing_plans")
        .select("*")
        .eq("slug", body.plan_slug)
        .eq("active", true)
        .single();
      if (error || !plan) return jsonResponse({ error: "Plan not found" }, 404);

      productId = plan.id;
      planSlug = plan.slug;
      credits = Number(plan.credits_monthly ?? plan.included_credits ?? 0);
      amount = Number(billingPeriod === "annual" ? plan.price_annual_usd : plan.price_monthly_usd);
      currency = plan.currency || "USD";
      displayName = plan.name_en || plan.slug;
    } else {
      const requestedCredits = Number(body.credits || 0);
      if (!Number.isFinite(requestedCredits) || requestedCredits <= 0) {
        return jsonResponse({ error: "credits must be greater than zero" }, 400);
      }
      const { data: pkg, error } = await admin
        .from("credit_packages")
        .select("*")
        .eq("credits", requestedCredits)
        .eq("active", true)
        .order("price", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error || !pkg) return jsonResponse({ error: "Credit package not found" }, 404);

      creditPackageId = pkg.id;
      credits = Number(pkg.credits || 0) + Number(pkg.bonus_credits || 0);
      amount = Number(pkg.price || 0);
      currency = pkg.currency || "USD";
      displayName = pkg.name_en || `${credits} credits`;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return jsonResponse({ error: "Invalid payment amount" }, 400);
    }

    const idempotencyKey = buildIdempotencyKey(user.id, body);
    const { data: order, error: orderError } = await admin
      .from("payment_orders")
      .insert({
        user_id: user.id,
        product_type: productType,
        plan_id: productId,
        plan_slug: planSlug || null,
        credit_package_id: creditPackageId,
        credits,
        billing_period: billingPeriod,
        amount,
        currency,
        provider,
        status: "created",
        idempotency_key: idempotencyKey,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { display_name: displayName },
      })
      .select("*")
      .single();

    if (orderError || !order) {
      console.error("create payment order failed:", orderError);
      return jsonResponse({ error: "Could not create payment order" }, 500);
    }

    try {
      const checkout = await createProviderCheckout(provider, {
        orderId: order.id,
        userEmail: user.email || "",
        productType,
        displayName,
        amount,
        currency,
        successUrl: `${successUrl}?order=${order.id}`,
        cancelUrl: `${cancelUrl}?order=${order.id}`,
        metadata: { order_id: order.id, user_id: user.id, product_type: productType },
      });

      await admin
        .from("payment_orders")
        .update({
          status: "pending",
          provider_checkout_id: checkout.providerCheckoutId,
          provider_payload: checkout.rawPayload || {},
        })
        .eq("id", order.id);

      return jsonResponse({
        success: true,
        order_id: order.id,
        checkout_url: checkout.checkoutUrl,
        provider,
      });
    } catch (err) {
      if (err instanceof PaymentProviderNotConfiguredError) {
        return jsonResponse({
          success: false,
          error: "payment_gateway_not_configured",
          message: "Payment gateway API is not connected yet. The internal order record was created and is ready for provider integration.",
          order_id: order.id,
          provider,
        });
      }
      throw err;
    }
  } catch (err) {
    console.error("create-payment-checkout error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
