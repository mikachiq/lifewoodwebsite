-- Add remarks column to admin_logs for admin notes on each log entry
-- Run in Supabase SQL Editor

ALTER TABLE public.admin_logs
ADD COLUMN IF NOT EXISTS remarks text;
