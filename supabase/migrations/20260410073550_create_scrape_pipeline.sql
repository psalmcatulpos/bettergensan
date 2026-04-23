
-- Scrape runs
create table public.scrape_runs (
  id bigint generated always as identity primary key,
  source_id text not null references public.sources(id),
  status text not null,
  trigger text not null default 'manual',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer,
  http_status integer,
  records_total integer not null default 0,
  records_inserted integer not null default 0,
  records_updated integer not null default 0,
  error_code text,
  error_message text,
  metadata jsonb
);

alter table public.scrape_runs enable row level security;
create policy "Anyone can read scrape_runs" on public.scrape_runs for select using (true);
create policy "Admins can manage scrape_runs" on public.scrape_runs for all using (public.is_admin());

-- Page fetches
create table public.page_fetches (
  id bigint generated always as identity primary key,
  run_id bigint not null references public.scrape_runs(id),
  url text not null,
  method text not null default 'GET',
  http_status integer,
  content_type text,
  bytes integer,
  duration_ms integer,
  error text,
  fetched_at timestamptz not null default now()
);

alter table public.page_fetches enable row level security;
create policy "Anyone can read page_fetches" on public.page_fetches for select using (true);
create policy "Admins can manage page_fetches" on public.page_fetches for all using (public.is_admin());

-- Snapshots
create table public.snapshots (
  id bigint generated always as identity primary key,
  source_id text not null references public.sources(id),
  run_id bigint references public.scrape_runs(id),
  kind text not null,
  inline jsonb,
  storage_path text,
  url text,
  sha256 text,
  bytes integer,
  captured_at timestamptz not null default now()
);

alter table public.snapshots enable row level security;
create policy "Anyone can read snapshots" on public.snapshots for select using (true);
create policy "Admins can manage snapshots" on public.snapshots for all using (public.is_admin());

-- Scrape alerts
create table public.scrape_alerts (
  id bigint generated always as identity primary key,
  source_id text not null references public.sources(id),
  run_id bigint references public.scrape_runs(id),
  severity text not null,
  kind text not null,
  message text,
  details jsonb,
  seen_count integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text
);

alter table public.scrape_alerts enable row level security;
create policy "Anyone can read scrape_alerts" on public.scrape_alerts for select using (true);
create policy "Admins can manage scrape_alerts" on public.scrape_alerts for all using (public.is_admin());

-- Validation results
create table public.validation_results (
  id bigint generated always as identity primary key,
  source_id text not null references public.sources(id),
  run_id bigint references public.scrape_runs(id),
  severity text not null default 'warning',
  issue text not null,
  field text,
  record_ref text,
  details jsonb,
  resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.validation_results enable row level security;
create policy "Anyone can read validation_results" on public.validation_results for select using (true);
create policy "Admins can manage validation_results" on public.validation_results for all using (public.is_admin());

-- resolve_alert function
create or replace function public.resolve_alert(alert_id bigint)
returns public.scrape_alerts as $$
  update public.scrape_alerts
  set resolved_at = now(), resolved_by = auth.uid()::text
  where id = alert_id
  returning *;
$$ language sql security definer;
