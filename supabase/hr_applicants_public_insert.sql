-- Allow anonymous (public) users to insert into hr_applicants
-- This lets the public career application form submit directly via Supabase client
-- Run in Supabase SQL Editor

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON public.hr_applicants TO anon;

DROP POLICY IF EXISTS "hr_applicants_public_insert" ON public.hr_applicants;
CREATE POLICY "hr_applicants_public_insert"
ON public.hr_applicants
FOR INSERT
WITH CHECK (status IS NULL);
