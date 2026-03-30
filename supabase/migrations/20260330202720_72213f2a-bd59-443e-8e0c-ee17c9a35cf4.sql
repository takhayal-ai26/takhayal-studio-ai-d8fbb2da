
-- 1. Fix generation_logs: remove anon read, add user-scoped + admin read
DROP POLICY IF EXISTS "Allow anon read generation_logs" ON public.generation_logs;

CREATE POLICY "User read own gen_logs" ON public.generation_logs
FOR SELECT TO authenticated
USING (((auth.uid())::text = user_id) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix tool-files: replace broad authenticated ALL with scoped policies
DROP POLICY IF EXISTS "Allow authenticated all tool-files" ON storage.objects;

CREATE POLICY "Auth upload own tool-files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'tool-files');

CREATE POLICY "Auth read tool-files" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'tool-files');

CREATE POLICY "Admin update tool-files" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'tool-files' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete tool-files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'tool-files' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix tool-covers: remove public write policies
DROP POLICY IF EXISTS "Allow upload tool-covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow update tool-covers" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete tool-covers" ON storage.objects;

-- Restrict authenticated write to admins only
DROP POLICY IF EXISTS "Auth upload tool-covers" ON storage.objects;
DROP POLICY IF EXISTS "Auth update tool-covers" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete tool-covers" ON storage.objects;

CREATE POLICY "Admin upload tool-covers" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'tool-covers' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin update tool-covers" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'tool-covers' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete tool-covers" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'tool-covers' AND public.has_role(auth.uid(), 'admin'::app_role));
