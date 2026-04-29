-- gov_jobs_cache — HRMDO government job vacancies for General Santos City.
-- Scraped directly from hrmdo.gensantos.gov.ph/index.php/Careers.

create table if not exists public.gov_jobs_cache (
  id text primary key,
  position text not null,
  plantilla_item_no text not null,
  salary_grade integer not null,
  monthly_salary numeric not null,
  place_of_assignment text not null,
  evaluator_email text,
  education text not null,
  training text not null,
  experience text not null,
  eligibility text not null,
  competency text not null,
  posting_date date,
  closing_date date,
  source_url text not null,
  apply_url text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  missing_from_source boolean not null default false
);

create index if not exists idx_gov_jobs_cache_closing on public.gov_jobs_cache (closing_date);
create index if not exists idx_gov_jobs_cache_posting on public.gov_jobs_cache (posting_date desc);
create index if not exists idx_gov_jobs_cache_salary_grade on public.gov_jobs_cache (salary_grade);

alter table public.gov_jobs_cache enable row level security;

create policy "Anyone can read gov_jobs_cache"
  on public.gov_jobs_cache for select using (true);

-- Register the source so admin dashboard picks it up automatically.
insert into public.sources (slug, name, type, expected_ttl_minutes, domain, base_url)
values (
  'gensan-hrmdo',
  'HRMDO Job Vacancies',
  'jobs',
  1440,
  'hrmdo.gensantos.gov.ph',
  'https://hrmdo.gensantos.gov.ph/index.php/Careers'
)
on conflict (slug) do nothing;
