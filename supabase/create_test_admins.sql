-- Create test admin accounts (admin@local1.com and admin@local2.com)
-- Password: admin123
-- Run in Supabase SQL Editor

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Remove any previous attempts (all variations of the email)
DELETE FROM auth.users
WHERE email IN ('admin@local1', 'admin@local1.com', 'admin@local2', 'admin@local2.com');

-- Create admin@local1.com
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@local1.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '{}',
  '{"username": "Admin 1"}',
  NOW(),
  NOW()
);

-- Create admin@local2.com
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@local2.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '{}',
  '{"username": "Admin 2"}',
  NOW(),
  NOW()
);

-- Grant admin access to both
UPDATE public.profiles
SET is_admin = true
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN ('admin@local1.com', 'admin@local2.com')
);
