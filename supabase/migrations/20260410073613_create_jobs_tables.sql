
-- Jobs
create table public.jobs (
  id text primary key,
  source text not null,
  source_id text not null,
  title text not null,
  description text,
  company_name text,
  company_image text,
  location text,
  country_code text,
  apply_url text,
  date_published text,
  raw jsonb,
  fetched_at timestamptz not null default now()
);

alter table public.jobs enable row level security;
create policy "Anyone can read jobs" on public.jobs for select using (true);
create policy "Admins can manage jobs" on public.jobs for all using (public.is_admin());

-- Jobs fetches
create table public.jobs_fetches (
  id bigint generated always as identity primary key,
  source text not null,
  location text,
  inserted_count integer not null default 0,
  error text,
  fetched_at timestamptz not null default now()
);

alter table public.jobs_fetches enable row level security;
create policy "Anyone can read jobs_fetches" on public.jobs_fetches for select using (true);
create policy "Admins can manage jobs_fetches" on public.jobs_fetches for all using (public.is_admin());
