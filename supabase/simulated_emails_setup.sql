-- Simulated email outbox for testing without a real email provider.
-- Run in the Supabase SQL editor.

create table if not exists public.simulated_emails (
  id uuid primary key default gen_random_uuid(),
  "to" text not null,
  "from" text not null default 'noreply@lifewoodph.com',
  subject text,
  body text,
  html text,
  context text, -- 'career' | 'project' | 'contact'
  inquiry_id uuid references public.inquiries (id) on delete set null,
  sent_at timestamptz not null default now()
);

alter table public.simulated_emails enable row level security;

drop policy if exists "simulated_emails_admin_only" on public.simulated_emails;
create policy "simulated_emails_admin_only"
on public.simulated_emails
for all
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

create index if not exists idx_simulated_emails_sent_at
  on public.simulated_emails (sent_at desc);
