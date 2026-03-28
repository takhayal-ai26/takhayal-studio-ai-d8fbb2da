-- Create a public bucket for tool cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('tool-covers', 'tool-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read tool cover images
CREATE POLICY "Public read tool-covers" ON storage.objects
FOR SELECT USING (bucket_id = 'tool-covers');

-- Allow anyone to upload tool cover images (admin use)
CREATE POLICY "Allow upload tool-covers" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'tool-covers');

-- Allow anyone to update tool cover images
CREATE POLICY "Allow update tool-covers" ON storage.objects
FOR UPDATE USING (bucket_id = 'tool-covers');

-- Allow anyone to delete tool cover images
CREATE POLICY "Allow delete tool-covers" ON storage.objects
FOR DELETE USING (bucket_id = 'tool-covers');