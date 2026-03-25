-- Auto-log new job applications into admin_logs as a system event
-- Run in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.log_new_applicant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_logs (
    admin_id,
    admin_email,
    admin_name,
    action,
    target_type,
    target_name,
    details
  ) VALUES (
    NULL,
    'system',
    'System',
    'application_received',
    'hr_applicant',
    NEW.name,
    'Applied for: ' || initcap(replace(NEW.role, '-', ' '))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_applicant ON public.hr_applicants;
CREATE TRIGGER on_new_applicant
AFTER INSERT ON public.hr_applicants
FOR EACH ROW EXECUTE FUNCTION public.log_new_applicant();
