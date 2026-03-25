-- Lifewood HR Pipeline Setup
-- Run in Supabase SQL Editor

-- Reuse or create set_updated_at trigger function
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- HR Positions (for public job listings)
create table if not exists public.hr_positions (
  id text primary key,
  title text not null,
  department text,
  employment_type text,
  location text,
  work_mode text,
  compensation text,
  application_form_type text not null default 'standard',
  details text,
  qualifications text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.hr_positions
  add column if not exists work_mode text,
  add column if not exists compensation text,
  add column if not exists application_form_type text not null default 'standard',
  add column if not exists details text,
  add column if not exists qualifications text[] not null default '{}';

alter table public.hr_positions enable row level security;

drop policy if exists "hr_positions_select_all" on public.hr_positions;
create policy "hr_positions_select_all"
on public.hr_positions for select using (true);

drop policy if exists "hr_positions_write_authenticated" on public.hr_positions;
create policy "hr_positions_write_authenticated"
on public.hr_positions for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

insert into public.hr_positions (
  id,
  title,
  department,
  employment_type,
  location,
  work_mode,
  compensation,
  application_form_type,
  details,
  qualifications,
  is_active
)
values
  (
    'senior-ai-data-architect',
    'Senior AI Data Architect',
    'Engineering',
    'Full-Time',
    'Remote / Global',
    'Remote',
    'Competitive & Merit-Based',
    'standard',
    'Lead applied AI and data architecture initiatives for global delivery teams.',
    array['5+ years experience in AI/data roles', 'Strong system design and data architecture skills', 'Comfort leading cross-functional technical workstreams'],
    true
  ),
  (
    'ai-data-intern',
    'AI Data Intern',
    'Data Science',
    'Internship',
    'Global / Hybrid',
    'Hybrid',
    'Competitive & Merit-Based',
    'intern',
    'Internship role for students supporting annotation, QA, prompt evaluation, and research tasks.',
    array['Currently enrolled in a relevant university program', 'Strong communication and organization skills', 'Interest in AI, data operations, or analytics'],
    true
  ),
  (
    'global-operations-manager',
    'Global Operations Manager',
    'Operations',
    'Full-Time',
    'Manila, PH',
    'Onsite',
    'Competitive & Merit-Based',
    'standard',
    'Coordinate international delivery operations, stakeholders, and service quality across regions.',
    array['Operations or program management experience', 'Strong stakeholder coordination ability', 'Comfort handling multi-region workflows'],
    true
  ),
  (
    'ai-training-associate',
    'AI Training Associate',
    'Quality Assurance',
    'Full-Time',
    'Global',
    'Hybrid',
    'Competitive & Merit-Based',
    'standard',
    'Support AI model evaluation, content review, prompt testing, and quality improvement initiatives.',
    array['Excellent written English', 'Strong analytical thinking', 'Experience with QA, annotation, or model evaluation is a plus'],
    true
  )
on conflict (id) do update
set
  title = excluded.title,
  department = excluded.department,
  employment_type = excluded.employment_type,
  location = excluded.location,
  work_mode = excluded.work_mode,
  compensation = excluded.compensation,
  application_form_type = excluded.application_form_type,
  details = excluded.details,
  qualifications = excluded.qualifications,
  is_active = excluded.is_active;

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;

drop policy if exists "resumes_public_read" on storage.objects;
create policy "resumes_public_read"
on storage.objects for select
using (bucket_id = 'resumes');

drop policy if exists "resumes_public_insert" on storage.objects;
create policy "resumes_public_insert"
on storage.objects for insert
with check (bucket_id = 'resumes');

-- HR Applicants
create table if not exists public.hr_applicants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text not null,
  applied_date timestamptz not null default now(),

  -- null = new/unprocessed; pipeline statuses below
  status text check (status in ('Screening Sent','Screening Completed','Interview Scheduled','Shortlisted','HIRED')),
  previous_status text check (previous_status in ('Screening Sent','Screening Completed','Interview Scheduled','Shortlisted','HIRED')),

  -- Screening
  screening_score numeric check (screening_score >= 0 and screening_score <= 100),
  screening_sent_at timestamptz,
  screening_completed_at timestamptz,

  last_contacted timestamptz,

  -- Interview
  interview_scheduled_for timestamptz,
  interview_meet_link text,
  interview_email_draft text,
  interview_invite_sent_at timestamptz,

  -- HR review
  hr_recommendation text,
  hr_feedback text,
  hr_reviewed_at timestamptz,

  -- Final
  talent_pool boolean not null default false,
  talent_pool_moved_at timestamptz,
  shortlisted_at timestamptz,

  notes text,
  resume_path text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hr_applicants enable row level security;

drop policy if exists "hr_applicants_authenticated_all" on public.hr_applicants;
create policy "hr_applicants_authenticated_all"
on public.hr_applicants for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Allow service role inserts from Express backend (service role bypasses RLS by default)

drop trigger if exists set_hr_applicants_updated_at on public.hr_applicants;
create trigger set_hr_applicants_updated_at
before update on public.hr_applicants
for each row execute function public.set_updated_at();

-- Enable realtime
alter table public.hr_applicants replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'hr_applicants'
  ) then
    alter publication supabase_realtime add table public.hr_applicants;
  end if;
end $$;

-- Indexes
create index if not exists idx_hr_applicants_status on public.hr_applicants (status);
create index if not exists idx_hr_applicants_email on public.hr_applicants (email);
create index if not exists idx_hr_applicants_applied_date on public.hr_applicants (applied_date desc);
create index if not exists idx_hr_applicants_talent_pool on public.hr_applicants (talent_pool) where talent_pool = true;
