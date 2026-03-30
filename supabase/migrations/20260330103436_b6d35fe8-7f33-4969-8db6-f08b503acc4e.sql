
-- Add new pricing columns to pricing_plans
ALTER TABLE public.pricing_plans 
  ADD COLUMN IF NOT EXISTS price_monthly_usd numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_annual_usd numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_annual_monthly_equivalent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS annual_discount_percent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_monthly integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add bonus_credits to credit_packages
ALTER TABLE public.credit_packages
  ADD COLUMN IF NOT EXISTS bonus_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_popular boolean NOT NULL DEFAULT false;
