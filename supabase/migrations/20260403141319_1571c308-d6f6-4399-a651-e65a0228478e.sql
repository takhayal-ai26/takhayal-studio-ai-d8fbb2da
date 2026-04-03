
-- Add status column to generation_logs
ALTER TABLE public.generation_logs 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed';

-- Enable realtime for generation_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.generation_logs;
