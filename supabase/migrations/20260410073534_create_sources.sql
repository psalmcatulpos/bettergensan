
create table public.sources (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  name text not null,
  type text not null,
  domain text,
  base_url text,
  schedule_cron text,
  expected_ttl_minutes integer not null default 60,
  is_active boolean not null default true,
  is_paused boolean not null default false,
  fallback_mode boolean not null default false,
  parser_version text,
  retry_policy jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sources enable row level security;
create policy "Anyone can read sources" on public.sources for select using (true);
create policy "Admins can manage sources" on public.sources for all using (public.is_admin());
