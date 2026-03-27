ALTER TABLE public.generation_logs 
  ADD COLUMN IF NOT EXISTS generation_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upscale_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_api_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_usd numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_usd numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin_pct numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS was_upscaled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS upscale_model text;