-- Lifewood: Enable realtime for notifications tables
-- Run in Supabase SQL editor after news_setup.sql and admin_notifications_setup.sql
--
-- Without this, Supabase realtime subscriptions on these tables don't fire,
-- so users never see new notifications until they manually refresh or the
-- 30-second poll catches up.

-- REPLICA IDENTITY FULL ensures the full row is available for realtime
-- column-level filters (e.g. user_id=eq.<uuid>).
alter table public.notifications replica identity full;
alter table public.admin_notifications replica identity full;

-- Add tables to the default Supabase realtime publication if not already there.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'admin_notifications'
  ) then
    alter publication supabase_realtime add table public.admin_notifications;
  end if;
end $$;
