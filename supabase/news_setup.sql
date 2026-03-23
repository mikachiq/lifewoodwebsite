-- Lifewood website: Company News feature setup
-- Run in the Supabase SQL editor after the existing setup scripts.

-- Required trigger function (safe to re-run)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create extension if not exists pgcrypto;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select is_admin
      from public.profiles
      where id = auth.uid()
    ),
    false
  );
$$;

alter table if exists public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "Admins view all profiles" on public.profiles;
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
using (auth.role() = 'authenticated');

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (auth.uid() = id or public.is_current_user_admin())
with check (auth.uid() = id or public.is_current_user_admin());

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  user_email text,
  message text not null,
  link text,
  inquiry_id uuid references public.inquiries (id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications
  add column if not exists user_id uuid references public.profiles (id) on delete cascade;

alter table public.notifications
  add column if not exists link text;

alter table public.notifications
  add column if not exists inquiry_id uuid references public.inquiries (id) on delete set null;

alter table public.notifications
  add column if not exists read boolean not null default false;

alter table public.notifications
  add column if not exists created_at timestamptz not null default now();

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications
for select
using (
  auth.role() = 'authenticated'
  and (
    user_id = auth.uid()
    or (user_id is null and user_email = auth.email())
    or public.is_current_user_admin()
  )
);

drop policy if exists "notifications_insert_authenticated" on public.notifications;
create policy "notifications_insert_authenticated"
on public.notifications
for insert
with check (
  auth.role() = 'authenticated'
  and (user_id is not null or user_email is not null)
);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications
for update
using (
  auth.role() = 'authenticated'
  and (
    user_id = auth.uid()
    or (user_id is null and user_email = auth.email())
    or public.is_current_user_admin()
  )
)
with check (
  auth.role() = 'authenticated'
  and (
    user_id = auth.uid()
    or (user_id is null and user_email = auth.email())
    or public.is_current_user_admin()
  )
);

create or replace function public.notify_users_new_published_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    insert into public.notifications (user_id, message, link, read)
    select
      p.id,
      'New post: ' || new.title,
      '/news/' || new.id,
      false
    from public.profiles p
    where p.id <> new.author_id
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_notify_users_new_published_post on public.news_posts;
create trigger trigger_notify_users_new_published_post
after insert or update on public.news_posts
for each row execute function public.notify_users_new_published_post();

create or replace function public.notify_comment_reply_recipient()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_owner uuid;
  post_title text;
  actor_name text;
begin
  if new.parent_comment_id is null then
    return new;
  end if;

  select c.user_id into parent_owner
  from public.news_comments c
  where c.id = new.parent_comment_id;

  if parent_owner is null or parent_owner = new.user_id then
    return new;
  end if;

  select title into post_title
  from public.news_posts
  where id = new.post_id;

  select coalesce(nullif(trim(username), ''), 'Someone')
  into actor_name
  from public.profiles
  where id = new.user_id;

  insert into public.notifications (user_id, message, link, read)
  values (
    parent_owner,
    coalesce(actor_name, 'Someone') || ' replied to your comment on ' || coalesce(post_title, 'a post'),
    '/news/' || new.post_id,
    false
  );

  return new;
end;
$$;

drop trigger if exists trigger_notify_comment_reply_recipient on public.news_comments;
create trigger trigger_notify_comment_reply_recipient
after insert on public.news_comments
for each row execute function public.notify_comment_reply_recipient();

create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  body text not null default '',
  cover_image_path text,
  gallery_image_paths text[] not null default '{}'::text[],
  author_id uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news_posts
  add column if not exists gallery_image_paths text[] not null default '{}'::text[];

alter table public.news_posts enable row level security;

drop trigger if exists set_news_posts_updated_at on public.news_posts;
create trigger set_news_posts_updated_at
before update on public.news_posts
for each row execute function public.set_updated_at();

drop policy if exists "news_posts_select" on public.news_posts;
create policy "news_posts_select"
on public.news_posts
for select
using (
  auth.role() = 'authenticated'
  and (
    status = 'published'
    or public.is_current_user_admin()
  )
);

drop policy if exists "news_posts_insert_admin" on public.news_posts;
create policy "news_posts_insert_admin"
on public.news_posts
for insert
with check (public.is_current_user_admin());

drop policy if exists "news_posts_update_admin" on public.news_posts;
create policy "news_posts_update_admin"
on public.news_posts
for update
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists "news_posts_delete_admin" on public.news_posts;
create policy "news_posts_delete_admin"
on public.news_posts
for delete
using (public.is_current_user_admin());

create table if not exists public.news_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.news_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'love', 'celebrate', 'insightful', 'funny')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table public.news_reactions enable row level security;

drop policy if exists "news_reactions_select" on public.news_reactions;
create policy "news_reactions_select"
on public.news_reactions
for select
using (
  auth.role() = 'authenticated'
  and exists (
    select 1
    from public.news_posts posts
    where posts.id = post_id
      and (posts.status = 'published' or public.is_current_user_admin())
  )
);

drop policy if exists "news_reactions_insert_own" on public.news_reactions;
create policy "news_reactions_insert_own"
on public.news_reactions
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.news_posts posts
    where posts.id = post_id
      and posts.status = 'published'
  )
);

drop policy if exists "news_reactions_update_own" on public.news_reactions;
create policy "news_reactions_update_own"
on public.news_reactions
for update
using (auth.uid() = user_id or public.is_current_user_admin())
with check (auth.uid() = user_id or public.is_current_user_admin());

drop policy if exists "news_reactions_delete_own" on public.news_reactions;
create policy "news_reactions_delete_own"
on public.news_reactions
for delete
using (auth.uid() = user_id or public.is_current_user_admin());

create table if not exists public.news_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.news_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  parent_comment_id uuid references public.news_comments (id) on delete cascade,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news_comments enable row level security;

drop trigger if exists set_news_comments_updated_at on public.news_comments;
create trigger set_news_comments_updated_at
before update on public.news_comments
for each row execute function public.set_updated_at();

drop policy if exists "news_comments_select" on public.news_comments;
create policy "news_comments_select"
on public.news_comments
for select
using (
  auth.role() = 'authenticated'
  and exists (
    select 1
    from public.news_posts posts
    where posts.id = post_id
      and (posts.status = 'published' or public.is_current_user_admin())
  )
);

drop policy if exists "news_comments_insert_own" on public.news_comments;
create policy "news_comments_insert_own"
on public.news_comments
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.news_posts posts
    where posts.id = post_id
      and posts.status = 'published'
  )
);

drop policy if exists "news_comments_update_own_or_admin" on public.news_comments;
create policy "news_comments_update_own_or_admin"
on public.news_comments
for update
using (auth.uid() = user_id or public.is_current_user_admin())
with check (auth.uid() = user_id or public.is_current_user_admin());

drop policy if exists "news_comments_delete_own_or_admin" on public.news_comments;
create policy "news_comments_delete_own_or_admin"
on public.news_comments
for delete
using (auth.uid() = user_id or public.is_current_user_admin());

insert into storage.buckets (id, name, public)
values ('news-covers', 'news-covers', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "news_covers_select_authenticated" on storage.objects;
create policy "news_covers_select_authenticated"
on storage.objects
for select
using (
  bucket_id = 'news-covers'
  and auth.role() = 'authenticated'
);

drop policy if exists "news_covers_insert_admin" on storage.objects;
create policy "news_covers_insert_admin"
on storage.objects
for insert
with check (
  bucket_id = 'news-covers'
  and public.is_current_user_admin()
);

drop policy if exists "news_covers_update_admin" on storage.objects;
create policy "news_covers_update_admin"
on storage.objects
for update
using (
  bucket_id = 'news-covers'
  and public.is_current_user_admin()
)
with check (
  bucket_id = 'news-covers'
  and public.is_current_user_admin()
);

drop policy if exists "news_covers_delete_admin" on storage.objects;
create policy "news_covers_delete_admin"
on storage.objects
for delete
using (
  bucket_id = 'news-covers'
  and public.is_current_user_admin()
);

create index if not exists idx_news_posts_status_created_at on public.news_posts (status, created_at desc);
create index if not exists idx_news_reactions_post_id on public.news_reactions (post_id);
create index if not exists idx_news_comments_post_id_created_at on public.news_comments (post_id, created_at asc);
create index if not exists idx_notifications_user_id_created_at on public.notifications (user_id, created_at desc);
