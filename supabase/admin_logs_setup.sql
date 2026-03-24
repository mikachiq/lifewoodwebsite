-- Admin Activity Logs
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email text NOT NULL,
  admin_name text,
  action text NOT NULL,
  target_type text,
  target_name text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_logs_select" ON public.admin_logs;
CREATE POLICY "admin_logs_select"
ON public.admin_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
));

DROP POLICY IF EXISTS "admin_logs_insert" ON public.admin_logs;
CREATE POLICY "admin_logs_insert"
ON public.admin_logs FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
));

DROP POLICY IF EXISTS "admin_logs_delete" ON public.admin_logs;
CREATE POLICY "admin_logs_delete"
ON public.admin_logs FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true
));

CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs (created_at DESC);
