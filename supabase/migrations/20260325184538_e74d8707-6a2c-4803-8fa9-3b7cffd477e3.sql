
CREATE POLICY "Allow anon update models" ON public.models FOR UPDATE TO anon USING (true) WITH CHECK (true);
