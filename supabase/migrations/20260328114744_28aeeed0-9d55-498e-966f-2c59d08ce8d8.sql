
-- Admin audit log table
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_value jsonb DEFAULT '{}'::jsonb,
  new_value jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon all admin_audit_log" ON public.admin_audit_log FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all admin_audit_log" ON public.admin_audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Index for faster querying
CREATE INDEX idx_audit_log_created ON public.admin_audit_log (created_at DESC);
CREATE INDEX idx_audit_log_entity ON public.admin_audit_log (entity_type, entity_id);
