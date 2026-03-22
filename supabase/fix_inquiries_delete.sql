-- Fix: Allow admins to DELETE from inquiries table
-- Run this in Supabase SQL Editor

-- 1. Grant DELETE permission to authenticated users
GRANT DELETE ON public.inquiries TO authenticated;

-- 2. Add RLS DELETE policy (admins only)
DROP POLICY IF EXISTS "Admin deletes inquiries" ON inquiries;
CREATE POLICY "Admin deletes inquiries" ON inquiries FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
