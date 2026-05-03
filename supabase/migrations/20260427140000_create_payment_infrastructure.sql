-- Gateway-agnostic payment infrastructure.
-- Provider-specific checkout/session/webhook details plug into these records later.

CREATE TABLE IF NOT EXISTS public.payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_type text NOT NULL CHECK (product_type IN ('subscription', 'credits')),
  plan_id uuid REFERENCES public.pricing_plans(id),
  plan_slug text,
  credit_package_id uuid REFERENCES public.credit_packages(id),
  credits integer NOT NULL DEFAULT 0,
  billing_period text CHECK (billing_period IN ('monthly', 'annual')),
  amount numeric(12, 2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'USD',
  provider text NOT NULL DEFAULT 'pending',
  provider_checkout_id text,
  provider_payment_id text,
  provider_subscription_id text,
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'pending', 'requires_action', 'paid', 'failed', 'canceled', 'expired', 'refunded')),
  idempotency_key text NOT NULL,
  success_url text NOT NULL DEFAULT '',
  cancel_url text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  paid_at timestamptz,
  fulfilled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS payment_orders_user_created_idx ON public.payment_orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_orders_provider_payment_idx ON public.payment_orders (provider, provider_payment_id);
CREATE INDEX IF NOT EXISTS payment_orders_provider_checkout_idx ON public.payment_orders (provider, provider_checkout_id);
CREATE INDEX IF NOT EXISTS payment_orders_status_idx ON public.payment_orders (status) WHERE fulfilled_at IS NULL;

CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  order_id uuid REFERENCES public.payment_orders(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS payment_events_order_idx ON public.payment_events (order_id);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.pricing_plans(id),
  plan_slug text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  billing_period text NOT NULL CHECK (billing_period IN ('monthly', 'annual')),
  provider text NOT NULL DEFAULT 'pending',
  provider_subscription_id text,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider, provider_subscription_id),
  UNIQUE (user_id, plan_slug)
);

CREATE INDEX IF NOT EXISTS user_subscriptions_user_idx ON public.user_subscriptions (user_id);

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.payment_orders(id) ON DELETE SET NULL,
  amount integer NOT NULL,
  reason text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_ledger_user_created_idx ON public.credit_ledger (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_order_reason_unique
  ON public.credit_ledger (order_id, reason)
  WHERE order_id IS NOT NULL;

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own payment orders" ON public.payment_orders;
CREATE POLICY "Users read own payment orders"
  ON public.payment_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin read payment orders" ON public.payment_orders;
CREATE POLICY "Admin read payment orders"
  ON public.payment_orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin read payment events" ON public.payment_events;
CREATE POLICY "Admin read payment events"
  ON public.payment_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users read own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users read own subscriptions"
  ON public.user_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin read subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admin read subscriptions"
  ON public.user_subscriptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users read own credit ledger" ON public.credit_ledger;
CREATE POLICY "Users read own credit ledger"
  ON public.credit_ledger FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin read credit ledger" ON public.credit_ledger;
CREATE POLICY "Admin read credit ledger"
  ON public.credit_ledger FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated read credit_packages" ON public.credit_packages;
CREATE POLICY "Authenticated read credit_packages"
  ON public.credit_packages FOR SELECT TO authenticated
  USING (true);

DROP TRIGGER IF EXISTS update_payment_orders_updated_at ON public.payment_orders;
CREATE TRIGGER update_payment_orders_updated_at
  BEFORE UPDATE ON public.payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.fulfill_payment_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.payment_orders%ROWTYPE;
  v_plan public.pricing_plans%ROWTYPE;
  v_credits integer := 0;
  v_period_end timestamptz;
BEGIN
  SELECT *
  INTO v_order
  FROM public.payment_orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'order_not_found');
  END IF;

  IF v_order.status <> 'paid' THEN
    RETURN jsonb_build_object('success', false, 'error', 'order_not_paid', 'status', v_order.status);
  END IF;

  IF v_order.fulfilled_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'already_fulfilled', true);
  END IF;

  IF v_order.product_type = 'credits' THEN
    v_credits := GREATEST(v_order.credits, 0);

    UPDATE public.profiles
    SET credits = credits + v_credits
    WHERE user_id = v_order.user_id;

    INSERT INTO public.credit_ledger (user_id, order_id, amount, reason, metadata)
    VALUES (
      v_order.user_id,
      v_order.id,
      v_credits,
      'credit_purchase',
      jsonb_build_object('provider', v_order.provider, 'amount', v_order.amount, 'currency', v_order.currency)
    )
    ON CONFLICT DO NOTHING;
  ELSE
    SELECT *
    INTO v_plan
    FROM public.pricing_plans
    WHERE id = v_order.plan_id OR slug = v_order.plan_slug
    LIMIT 1;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'plan_not_found');
    END IF;

    v_credits := GREATEST(COALESCE(v_plan.credits_monthly, v_plan.included_credits, 0), 0);
    v_period_end := now() + CASE WHEN v_order.billing_period = 'annual' THEN interval '1 year' ELSE interval '1 month' END;

    UPDATE public.profiles
    SET plan = v_plan.slug,
        credits = credits + v_credits
    WHERE user_id = v_order.user_id;

    INSERT INTO public.user_subscriptions (
      user_id,
      plan_id,
      plan_slug,
      status,
      billing_period,
      provider,
      provider_subscription_id,
      current_period_start,
      current_period_end,
      metadata
    )
    VALUES (
      v_order.user_id,
      v_plan.id,
      v_plan.slug,
      'active',
      COALESCE(v_order.billing_period, 'monthly'),
      v_order.provider,
      COALESCE(v_order.provider_subscription_id, v_order.provider_payment_id, v_order.id::text),
      now(),
      v_period_end,
      jsonb_build_object('order_id', v_order.id)
    )
    ON CONFLICT (user_id, plan_slug)
    DO UPDATE SET
      plan_id = EXCLUDED.plan_id,
      status = EXCLUDED.status,
      billing_period = EXCLUDED.billing_period,
      provider = EXCLUDED.provider,
      provider_subscription_id = EXCLUDED.provider_subscription_id,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = now();

    INSERT INTO public.credit_ledger (user_id, order_id, amount, reason, metadata)
    VALUES (
      v_order.user_id,
      v_order.id,
      v_credits,
      'subscription_activation',
      jsonb_build_object('plan_slug', v_plan.slug, 'billing_period', v_order.billing_period)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  UPDATE public.payment_orders
  SET fulfilled_at = now()
  WHERE id = v_order.id;

  RETURN jsonb_build_object('success', true, 'credits_granted', v_credits, 'product_type', v_order.product_type);
END;
$$;
