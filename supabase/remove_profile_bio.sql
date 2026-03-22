-- Remove deprecated bio field from profiles.
-- Run this once in the Supabase SQL editor.

alter table if exists public.profiles
drop column if exists bio;
