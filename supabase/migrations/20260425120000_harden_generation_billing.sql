ALTER TABLE public.generation_logs
ADD COLUMN IF NOT EXISTS credits_charged_at timestamptz;

DROP POLICY IF EXISTS "Anon insert gen_logs" ON public.generation_logs;
DROP POLICY IF EXISTS "Allow anon insert generation_logs" ON public.generation_logs;

DROP POLICY IF EXISTS "Anon insert tool_runs" ON public.tool_runs;
DROP POLICY IF EXISTS "Allow anon insert tool_runs" ON public.tool_runs;
