-- Lifewood: Admin Notifications setup
-- Run in Supabase SQL editor after news_setup.sql

-- Table to store admin-side notifications
create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.admin_notifications enable row level security;

-- Only admins can read admin notifications
drop policy if exists "admin_notifications_select" on public.admin_notifications;
create policy "admin_notifications_select"
on public.admin_notifications
for select
using (public.is_current_user_admin());

-- Only admins can mark as read
drop policy if exists "admin_notifications_update" on public.admin_notifications;
create policy "admin_notifications_update"
on public.admin_notifications
for update
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

-- Triggers insert via SECURITY DEFINER functions (bypasses RLS)
drop policy if exists "admin_notifications_insert" on public.admin_notifications;
create policy "admin_notifications_insert"
on public.admin_notifications
for insert
with check (true);

-- ─── Trigger: new inquiry ─────────────────────────────────────────────────────
create or replace function public.notify_admin_new_inquiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  msg text;
  nav_link text;
begin
  if new.context = 'contact' then
    msg := 'New contact message from ' || coalesce(new.name, 'someone');
    nav_link := '/admin?section=contacts';
  elsif new.context = 'career' then
    msg := 'New job application from ' || coalesce(new.name, 'someone');
    nav_link := '/admin?section=applicants';
  else
    msg := 'New project request from ' || coalesce(new.name, 'someone');
    nav_link := '/admin?section=projects';
  end if;

  insert into public.admin_notifications (type, message, link)
  values ('new_inquiry_' || new.context, msg, nav_link);

  return new;
end;
$$;

drop trigger if exists trigger_notify_admin_new_inquiry on public.inquiries;
create trigger trigger_notify_admin_new_inquiry
after insert on public.inquiries
for each row execute function public.notify_admin_new_inquiry();

-- ─── Trigger: new reaction ────────────────────────────────────────────────────
create or replace function public.notify_admin_new_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_title text;
begin
  select title into post_title from public.news_posts where id = new.post_id;

  insert into public.admin_notifications (type, message, link)
  values (
    'new_reaction',
    new.reaction_type || ' reaction on "' || coalesce(post_title, 'a post') || '"',
    '/news/' || new.post_id
  );

  return new;
end;
$$;

drop trigger if exists trigger_notify_admin_new_reaction on public.news_reactions;
create trigger trigger_notify_admin_new_reaction
after insert on public.news_reactions
for each row execute function public.notify_admin_new_reaction();

-- ─── Trigger: new comment ─────────────────────────────────────────────────────
create or replace function public.notify_admin_new_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_title text;
begin
  select title into post_title from public.news_posts where id = new.post_id;

  insert into public.admin_notifications (type, message, link)
  values (
    'new_comment',
    'New comment on "' || coalesce(post_title, 'a post') || '"',
    '/news/' || new.post_id
  );

  return new;
end;
$$;

drop trigger if exists trigger_notify_admin_new_comment on public.news_comments;
create trigger trigger_notify_admin_new_comment
after insert on public.news_comments
for each row execute function public.notify_admin_new_comment();

-- Index for quick unread queries
create index if not exists idx_admin_notifications_created_at
on public.admin_notifications (created_at desc);
