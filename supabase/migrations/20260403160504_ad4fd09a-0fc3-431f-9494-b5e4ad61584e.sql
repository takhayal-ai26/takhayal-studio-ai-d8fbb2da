CREATE POLICY "User update own gen_logs"
ON public.generation_logs
FOR UPDATE
TO authenticated
USING (((auth.uid())::text = user_id))
WITH CHECK (((auth.uid())::text = user_id));