-- Notification trigger for hr_applicants
-- Run in Supabase SQL Editor

create or replace function public.notify_admin_new_hr_applicant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_notifications (type, message, link)
  values (
    'new_inquiry_career',
    'New job application from ' || coalesce(new.name, 'someone'),
    '/admin?section=applicants'
  );
  return new;
end;
$$;

drop trigger if exists trigger_notify_admin_new_hr_applicant on public.hr_applicants;
create trigger trigger_notify_admin_new_hr_applicant
after insert on public.hr_applicants
for each row execute function public.notify_admin_new_hr_applicant();
