
-- Step 1: Add columns to model_pricing_tiers
ALTER TABLE public.model_pricing_tiers
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS resolution_label text,
  ADD COLUMN IF NOT EXISTS actual_pixels integer;

-- Step 2: Populate resolution_label and actual_pixels from quality_level
UPDATE public.model_pricing_tiers SET resolution_label = quality_level WHERE resolution_label IS NULL AND quality_level IS NOT NULL;
UPDATE public.model_pricing_tiers SET actual_pixels = 1024 WHERE quality_level = '1K' AND actual_pixels IS NULL;
UPDATE public.model_pricing_tiers SET actual_pixels = 2048 WHERE quality_level = '2K' AND actual_pixels IS NULL;
UPDATE public.model_pricing_tiers SET actual_pixels = 4096 WHERE quality_level = '4K' AND actual_pixels IS NULL;

-- Step 3: Create model_test_log table
CREATE TABLE IF NOT EXISTS public.model_test_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id uuid NOT NULL,
  resolution_label text NOT NULL,
  expected_pixels integer NOT NULL,
  actual_pixels_returned integer,
  passed boolean NOT NULL DEFAULT false,
  error_message text,
  tested_at timestamptz NOT NULL DEFAULT now(),
  tested_by text
);

ALTER TABLE public.model_test_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read model_test_log"
  ON public.model_test_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin write model_test_log"
  ON public.model_test_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete model_test_log"
  ON public.model_test_log FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Step 4: Create atomic deduct_credits function
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_model_id uuid DEFAULT NULL,
  p_resolution text DEFAULT NULL,
  p_tool_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits integer;
  v_new_credits integer;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT credits INTO v_current_credits
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found', 'balance', 0);
  END IF;

  IF v_current_credits < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_credits', 'balance', v_current_credits);
  END IF;

  v_new_credits := v_current_credits - p_amount;

  UPDATE public.profiles
  SET credits = v_new_credits, updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'balance', v_new_credits, 'deducted', p_amount);
END;
$$;

-- Step 5: Create refund_credits function
CREATE OR REPLACE FUNCTION public.refund_credits(
  p_user_id uuid,
  p_amount integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_credits integer;
BEGIN
  UPDATE public.profiles
  SET credits = credits + p_amount, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING credits INTO v_new_credits;

  IF v_new_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;

  RETURN jsonb_build_object('success', true, 'balance', v_new_credits, 'refunded', p_amount);
END;
$$;
