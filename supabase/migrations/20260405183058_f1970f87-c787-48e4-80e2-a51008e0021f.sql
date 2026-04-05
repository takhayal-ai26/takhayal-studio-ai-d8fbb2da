-- Create community_posts table
CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  username text NOT NULL DEFAULT '',
  avatar_url text DEFAULT '',
  image_url text NOT NULL,
  prompt text DEFAULT '',
  model text DEFAULT '',
  ratio text DEFAULT '',
  quality_or_resolution text DEFAULT '',
  source_generation_id uuid,
  source_type text NOT NULL DEFAULT 'generation',
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  approved_by text,
  rejected_at timestamptz,
  rejected_by text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Public can view approved posts
CREATE POLICY "Anyone can view approved community posts"
ON public.community_posts FOR SELECT
TO anon
USING (status = 'approved');

-- Authenticated users can view approved posts
CREATE POLICY "Authenticated view approved community posts"
ON public.community_posts FOR SELECT
TO authenticated
USING (status = 'approved' OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Users can insert their own posts
CREATE POLICY "Users can submit community posts"
ON public.community_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admin can update any post
CREATE POLICY "Admin update community posts"
ON public.community_posts FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admin can delete any post
CREATE POLICY "Admin delete community posts"
ON public.community_posts FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admin can insert (for test posts)
CREATE POLICY "Admin insert community posts"
ON public.community_posts FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();