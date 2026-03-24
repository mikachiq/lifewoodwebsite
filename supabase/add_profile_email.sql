-- Add email column to profiles and sync it from auth.users
-- Run in Supabase SQL Editor

-- 1) Add email column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email text;

-- 2) Backfill existing rows from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- 3) Update trigger so new signups auto-populate email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'username',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.email
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  RETURN new;
END;
$$;

-- 4) Fix test admin emails to valid format (TLD required by Supabase Auth)
UPDATE auth.users
SET email = 'admin@local1.com', email_confirmed_at = now()
WHERE email = 'admin@local1';

UPDATE auth.users
SET email = 'admin@local2.com', email_confirmed_at = now()
WHERE email = 'admin@local2';

-- 5) Re-sync profiles after updating auth.users emails above
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;
