
-- Fix 1: Restrict user_roles read access (was public/anonymous)
DROP POLICY IF EXISTS "Anyone can read roles" ON public.user_roles;

CREATE POLICY "Users read own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Restrict tool-files uploads to user's own folder
DROP POLICY IF EXISTS "Auth upload own tool-files" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload tool-files" ON storage.objects;

CREATE POLICY "Users upload to own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'tool-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
