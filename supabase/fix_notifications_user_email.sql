-- Fix: notifications.user_email must be nullable
-- The notify_comment_reply_recipient trigger inserts a notification with only
-- user_id (no user_email), but the column was accidentally set to NOT NULL in
-- the database. Drop the constraint so reply notifications work.

alter table public.notifications alter column user_email drop not null;
