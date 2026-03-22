-- Lifewood website: Supabase setup (profiles + avatars storage + admin)
-- Run in Supabase SQL editor.

-- 1) Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  avatar_url text,
  is_admin boolean DEFAULT false,
  updated_at timestamptz not null default now()
);

-- Add is_admin column to existing profiles table (safe upgrade)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (auth.uid() = id OR is_admin = true);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (auth.uid() = id OR (is_admin = true AND auth.uid() != id))
with check (auth.uid() = id OR is_admin = true);

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- 2) Auto-create profile row on new user sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 3) Storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do update set public = excluded.public;

-- 4) Storage policies: only the owner can access their own avatar objects
-- Note: storage.objects has RLS enabled in Supabase projects by default.
drop policy if exists "avatars_read_own" on storage.objects;
create policy "avatars_read_own"
on storage.objects
for select
using (bucket_id = 'avatars' and auth.uid() = owner);

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
on storage.objects
for insert
with check (bucket_id = 'avatars' and auth.uid() = owner);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
on storage.objects
for update
using (bucket_id = 'avatars' and auth.uid() = owner)
with check (bucket_id = 'avatars' and auth.uid() = owner);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
on storage.objects
for delete
using (bucket_id = 'avatars' and auth.uid() = owner);

-- 5) Public attachment buckets for career/project form uploads
insert into storage.buckets (id, name, public)
values
  ('application-attachments', 'application-attachments', true),
  ('project-attachments', 'project-attachments', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "application_attachments_public_read" on storage.objects;
create policy "application_attachments_public_read"
on storage.objects
for select
using (bucket_id = 'application-attachments');

drop policy if exists "application_attachments_public_insert" on storage.objects;
create policy "application_attachments_public_insert"
on storage.objects
for insert
with check (bucket_id = 'application-attachments');

drop policy if exists "project_attachments_public_read" on storage.objects;
create policy "project_attachments_public_read"
on storage.objects
for select
using (bucket_id = 'project-attachments');

drop policy if exists "project_attachments_public_insert" on storage.objects;
create policy "project_attachments_public_insert"
on storage.objects
for insert
with check (bucket_id = 'project-attachments');

-- 🔥 ADMIN USER CREATION (Run ONCE after table setup)
-- ⚠️  Copy the generated ID to the UPDATE below!
INSERT INTO auth.users (
  instance_id, 
  id, 
  aud, 
  role, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  raw_app_meta_data, 
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@lifewood.local',
  -- Password: "admin" (hashed with Supabase crypt)
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  NOW(),
  '{}',
  '{"username": "admin"}'
) RETURNING id;

-- ⚠️ REPLACE '00000000-...' BELOW WITH ID FROM ABOVE:
-- UPDATE profiles SET is_admin = true WHERE id = 'PASTE_USER_ID_HERE';
