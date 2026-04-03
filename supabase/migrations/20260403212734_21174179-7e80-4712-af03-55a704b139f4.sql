
-- Add dimension columns to templates
ALTER TABLE public.templates 
  ADD COLUMN IF NOT EXISTS width integer,
  ADD COLUMN IF NOT EXISTS height integer;

-- Create storage bucket for template covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('template-covers', 'template-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Template covers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'template-covers');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload template covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'template-covers' AND auth.role() = 'authenticated');

-- Authenticated users can update/replace
CREATE POLICY "Authenticated users can update template covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'template-covers' AND auth.role() = 'authenticated');

-- Authenticated users can delete
CREATE POLICY "Authenticated users can delete template covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'template-covers' AND auth.role() = 'authenticated');
