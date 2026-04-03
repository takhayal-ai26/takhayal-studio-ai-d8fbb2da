-- Add sharing columns to generation_logs
ALTER TABLE public.generation_logs
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_id text UNIQUE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS share_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_shared_to_community boolean NOT NULL DEFAULT false;

-- Index for fast public link lookups
CREATE INDEX IF NOT EXISTS idx_generation_logs_public_id ON public.generation_logs (public_id) WHERE public_id IS NOT NULL;

-- Index for community feed queries
CREATE INDEX IF NOT EXISTS idx_generation_logs_community ON public.generation_logs (is_shared_to_community, created_at DESC) WHERE is_shared_to_community = true;

-- Allow anyone to read public images (for share page and community)
CREATE POLICY "Anyone can view public images"
  ON public.generation_logs
  FOR SELECT
  TO anon
  USING (is_public = true OR is_shared_to_community = true);
