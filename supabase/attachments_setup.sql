-- Lifewood: public attachment buckets for career and project submissions
-- Run this in Supabase SQL editor.

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
