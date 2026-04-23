
-- Infrastructure projects
create table public.infrastructure_projects (
  id text primary key default gen_random_uuid()::text,
  external_id text not null,
  source text not null default 'philgeps',
  title text not null,
  description text,
  agency text,
  contractor text,
  location_text text,
  region text,
  province text,
  city_municipality text,
  barangay text,
  latitude double precision,
  longitude double precision,
  budget_amount numeric,
  status text,
  start_date text,
  end_date text,
  category text,
  raw_payload jsonb,
  geographic_scope_match text not null default 'exact',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),
  source_removed_at timestamptz,
  archive_status text not null default 'active'
);

alter table public.infrastructure_projects enable row level security;
create policy "Anyone can read infra projects" on public.infrastructure_projects for select using (true);
create policy "Admins can manage infra projects" on public.infrastructure_projects for all using (public.is_admin());

-- Source upstream health
create table public.source_upstream_health (
  source_key text primary key,
  source_name text not null,
  source_url text not null,
  status text not null default 'unknown',
  http_status integer,
  response_time_ms integer,
  is_cloudflare_error boolean not null default false,
  content_ok boolean not null default true,
  status_reason text,
  error_message text,
  checked_at timestamptz
);

alter table public.source_upstream_health enable row level security;
create policy "Anyone can read upstream health" on public.source_upstream_health for select using (true);
create policy "Admins can manage upstream health" on public.source_upstream_health for all using (public.is_admin());
