export type CheckoutRequest = {
  orderId: string;
  userEmail: string;
  productType: "subscription" | "credits";
  displayName: string;
  amount: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, unknown>;
};

export type CheckoutResponse = {
  checkoutUrl: string;
  providerCheckoutId: string;
  rawPayload?: Record<string, unknown>;
};

export type NormalizedPaymentEvent = {
  providerEventId: string;
  eventType: string;
  orderId?: string;
  status?: "paid" | "failed" | "canceled" | "expired" | "refunded";
  providerPaymentId?: string;
  providerSubscriptionId?: string;
  rawPayload: Record<string, unknown>;
};

export class PaymentProviderNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`Payment provider "${provider}" is not configured yet.`);
    this.name = "PaymentProviderNotConfiguredError";
  }
}

export function getPaymentProviderName() {
  return Deno.env.get("PAYMENT_GATEWAY_PROVIDER") || "pending";
}

export async function createProviderCheckout(
  provider: string,
  _request: CheckoutRequest
): Promise<CheckoutResponse> {
  // Gateway-specific API integration belongs here once the provider docs arrive.
  // The database order is already created before this is called, so the future
  // implementation only needs to create the provider session and return its URL.
  throw new PaymentProviderNotConfiguredError(provider);
}

export async function normalizePaymentWebhook(
  provider: string,
  req: Request
): Promise<NormalizedPaymentEvent> {
  // Temporary manual webhook format for local/internal testing:
  // {
  //   "event_id": "...",
  //   "type": "payment.paid",
  //   "order_id": "...",
  //   "status": "paid",
  //   "payment_id": "...",
  //   "subscription_id": "..."
  // }
  if (provider !== "manual") {
    throw new PaymentProviderNotConfiguredError(provider);
  }

  const body = await req.json();
  return {
    providerEventId: String(body.event_id || crypto.randomUUID()),
    eventType: String(body.type || "payment.updated"),
    orderId: body.order_id ? String(body.order_id) : undefined,
    status: body.status,
    providerPaymentId: body.payment_id ? String(body.payment_id) : undefined,
    providerSubscriptionId: body.subscription_id ? String(body.subscription_id) : undefined,
    rawPayload: body,
  };
}
