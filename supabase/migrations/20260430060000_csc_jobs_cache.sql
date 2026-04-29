-- csc_jobs_cache — CSC (Civil Service Commission) job vacancies filtered to
-- General Santos City. Scraped directly from csc.gov.ph/career/ DataTables API.

create table if not exists public.csc_jobs_cache (
  id bigserial primary key,
  csc_record_id text,
  position text not null,
  agency text,
  place_of_assignment text,
  region text,
  salary_grade int,
  monthly_salary numeric,
  eligibility text,
  education text,
  training text,
  experience text,
  competency text,
  plantilla_item_no text,
  posting_date date,
  closing_date date,
  apply_url text,
  source_url text,
  raw jsonb not null,
  hash text not null,
  status text not null default 'active' check (status in ('active', 'missing_from_source')),
  source_removed_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),
  scraped_at timestamptz not null default now(),
  source_slug text not null default 'csc-gensan',
  module_run_id text
);

create unique index if not exists idx_csc_jobs_cache_hash on public.csc_jobs_cache (hash);
create index if not exists idx_csc_jobs_cache_closing on public.csc_jobs_cache (closing_date);
create index if not exists idx_csc_jobs_cache_posting on public.csc_jobs_cache (posting_date desc);
create index if not exists idx_csc_jobs_cache_salary_grade on public.csc_jobs_cache (salary_grade);
create index if not exists idx_csc_jobs_cache_status on public.csc_jobs_cache (status);

alter table public.csc_jobs_cache enable row level security;

create policy "Anyone can read csc_jobs_cache"
  on public.csc_jobs_cache for select using (true);
