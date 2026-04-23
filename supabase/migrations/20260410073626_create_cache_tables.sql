
-- Executive Orders cache
create table public.executive_orders_cache (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  order_number text,
  date_issued text,
  year integer,
  summary text,
  source_url text not null,
  download_url text,
  has_download boolean not null default false,
  drive_file_id text,
  status text not null default 'active',
  source_removed_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now()
);

alter table public.executive_orders_cache enable row level security;
create policy "Anyone can read EO cache" on public.executive_orders_cache for select using (true);
create policy "Admins can manage EO cache" on public.executive_orders_cache for all using (public.is_admin());

-- SPLIS cache
create table public.splis_cache (
  id text primary key default gen_random_uuid()::text,
  source_slug text not null,
  record_type text not null,
  record_no text not null,
  record_year integer,
  title text not null,
  category text,
  internal_id text,
  pdf_url text,
  pdf_filename text,
  view_count integer,
  status text not null default 'active',
  source_removed_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now()
);

alter table public.splis_cache enable row level security;
create policy "Anyone can read SPLIS cache" on public.splis_cache for select using (true);
create policy "Admins can manage SPLIS cache" on public.splis_cache for all using (public.is_admin());

-- Procurement cache
create table public.procurement_cache (
  id text primary key default gen_random_uuid()::text,
  endpoint text not null,
  external_id text,
  reference_number text,
  title text not null,
  description text,
  category text,
  procurement_mode text,
  amount numeric,
  amount_currency text,
  date_posted text,
  date_raw text,
  status text not null default 'active',
  source_removed_at timestamptz,
  supplier text,
  source_url text not null,
  detail_url text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now()
);

alter table public.procurement_cache enable row level security;
create policy "Anyone can read procurement cache" on public.procurement_cache for select using (true);
create policy "Admins can manage procurement cache" on public.procurement_cache for all using (public.is_admin());
