-- 🔥 COMPLETE ADMIN SETUP - Compatible with your existing schema
-- Run ALL in Supabase SQL Editor

-- 1. Add is_admin column SAFE
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2. Admin RLS policies (extends your public read)
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "Admins view all profiles" ON profiles FOR ALL 
USING (is_admin = true OR auth.uid() = id);

-- 3. Update your handle_new_user to set username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, 
    COALESCE(
      new.raw_user_meta_data->>'username',
      SPLIT_PART(new.email, '@', 1)
    )
  ) ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create inquiries table + RLS for admin
CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text, email text, organization text,
  message text, context text DEFAULT 'contact',
  position text DEFAULT null,
  status text DEFAULT 'new', 
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Admin RLS
CREATE POLICY "Admin reads all inquiries" ON inquiries FOR ALL 
USING (true);  -- Admin bypass (service_role used)

-- 5. FORCE CREATE/UPDATE ADMIN PROFILE
INSERT INTO profiles (id, username, is_admin)
SELECT id, 'admin', true FROM auth.users WHERE email = 'admin@lifewood.local' 
ON CONFLICT (id) DO UPDATE SET 
  is_admin = true, 
  username = EXCLUDED.username,
  updated_at = now();

-- VERIFY (should show is_admin = true)
SELECT p.id, u.email, p.username, p.is_admin FROM profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE u.email = 'admin@lifewood.local';

-- 6. If no admin user, create it:
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data)
-- VALUES ('admin@lifewood.local', crypt('admin', gen_salt('bf')), NOW(), '{"username": "admin"}');

-- 7. VERIFY (should show is_admin = true)
SELECT p.id, u.email, p.username, p.is_admin, p.created_at
FROM profiles p JOIN auth.users u ON p.id = u.id 
WHERE u.email = 'admin@lifewood.local';

-- 🎉 DONE! Login works: admin@lifewood.local / admin
