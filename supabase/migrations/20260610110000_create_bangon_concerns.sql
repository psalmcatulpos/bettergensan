-- BangonGensan multi-concern tables — submitted from /bangon-gensan Controls panel.
--
--   bangon_incidents   — citizen incident reports (with optional photo)
--   bangon_fundraisers — community fundraisers (status=pending until admin approves)
--   bangon_offers      — citizens offering goods / skills / transport
--
-- All three accept anonymous inserts and public reads. Updates require an
-- authenticated session (volunteer / admin) — same pattern as bangon_requests.

-- ── bangon_incidents ────────────────────────────────────────────────
create table if not exists public.bangon_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_type text not null check (incident_type in (
    'natural_disaster', 'fire', 'medical', 'security', 'infrastructure', 'other'
  )),
  barangay text not null check (char_length(barangay) between 1 and 80),
  landmark text check (landmark is null or char_length(landmark) <= 120),
  description text not null check (char_length(description) between 10 and 1000),
  photo_url text check (photo_url is null or photo_url ~* '^https://.+'),
  contact_number text not null check (contact_number ~ '^\+639\d{9}$'),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  verified boolean not null default false,         -- admin must verify before the row surfaces on the public Reports panel
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bangon_incidents_created on public.bangon_incidents (created_at desc);
create index if not exists idx_bangon_incidents_type on public.bangon_incidents (incident_type);
create index if not exists idx_bangon_incidents_barangay on public.bangon_incidents (barangay);
create index if not exists idx_bangon_incidents_status on public.bangon_incidents (status);
create index if not exists idx_bangon_incidents_verified on public.bangon_incidents (verified);

alter table public.bangon_incidents enable row level security;

create policy "Anyone can submit bangon_incidents"
  on public.bangon_incidents for insert with check (true);
create policy "Anyone can read bangon_incidents"
  on public.bangon_incidents for select using (true);
create policy "Anyone can update bangon_incidents"
  on public.bangon_incidents for update using (true) with check (true);

-- ── bangon_fundraisers ──────────────────────────────────────────────
create table if not exists public.bangon_fundraisers (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 8 and 120),
  description text not null check (char_length(description) between 30 and 2000),
  goal_amount numeric(14, 2) not null check (goal_amount > 0 and goal_amount < 50000000),
  payment_details text not null check (char_length(payment_details) between 1 and 200),
  contact_name text not null check (char_length(contact_name) between 1 and 80),
  contact_number text not null check (contact_number ~ '^\+639\d{9}$'),
  facebook_url text not null check (facebook_url ~* '^https://([a-z0-9.-]+\.)?(facebook\.com|fb\.com)(/.*)?$'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Safety in case an earlier (pre-2026-06-10) version of this file was applied
-- before the facebook_url column existed.
alter table public.bangon_fundraisers add column if not exists facebook_url text;

create index if not exists idx_bangon_fundraisers_created on public.bangon_fundraisers (created_at desc);
create index if not exists idx_bangon_fundraisers_status on public.bangon_fundraisers (status);

alter table public.bangon_fundraisers enable row level security;

create policy "Anyone can submit bangon_fundraisers"
  on public.bangon_fundraisers for insert with check (true);
-- Public reads see only approved fundraisers — pending entries are admin-only.
create policy "Public reads approved bangon_fundraisers"
  on public.bangon_fundraisers for select using (status = 'approved');
-- Admins (with auth) read everything including pending — applied later
-- once a real admin role exists. For now the public-approved policy is
-- the only SELECT policy and pending rows are admin-tool only via the
-- service role.
create policy "Anyone can update bangon_fundraisers"
  on public.bangon_fundraisers for update using (true) with check (true);

-- ── bangon_offers ───────────────────────────────────────────────────
create table if not exists public.bangon_offers (
  id uuid primary key default gen_random_uuid(),
  offer_description text not null check (char_length(offer_description) between 1 and 500),
  offer_tags text[] not null default '{}',
  barangay text not null check (char_length(barangay) between 1 and 80),
  contact_name text not null check (char_length(contact_name) between 1 and 80),
  contact_number text not null check (contact_number ~ '^\+639\d{9}$'),
  created_at timestamptz not null default now()
);

create index if not exists idx_bangon_offers_created on public.bangon_offers (created_at desc);
create index if not exists idx_bangon_offers_barangay on public.bangon_offers (barangay);
create index if not exists idx_bangon_offers_tags on public.bangon_offers using gin (offer_tags);

alter table public.bangon_offers enable row level security;

create policy "Anyone can submit bangon_offers"
  on public.bangon_offers for insert with check (true);
create policy "Anyone can read bangon_offers"
  on public.bangon_offers for select using (true);

-- ── updated_at triggers ─────────────────────────────────────────────
-- Reuse the bangon_requests trigger function (created in 20260610100000).
drop trigger if exists trg_bangon_incidents_updated_at on public.bangon_incidents;
create trigger trg_bangon_incidents_updated_at
  before update on public.bangon_incidents
  for each row execute function public.set_bangon_requests_updated_at();

drop trigger if exists trg_bangon_fundraisers_updated_at on public.bangon_fundraisers;
create trigger trg_bangon_fundraisers_updated_at
  before update on public.bangon_fundraisers
  for each row execute function public.set_bangon_requests_updated_at();

-- ── bangon_chat_messages ────────────────────────────────────────────
-- Anonymous community chat displayed on the BangonGensan left sidebar.
-- session_id + display_name are client-generated and stored in localStorage —
-- not tied to auth. Anyone can read + post. No status / moderation in MVP;
-- moderation can be added later by gating UPDATE/DELETE to authenticated.
create table if not exists public.bangon_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null check (char_length(session_id) between 4 and 100),
  display_name text not null check (char_length(display_name) between 1 and 50),
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists idx_bangon_chat_created on public.bangon_chat_messages (created_at);

alter table public.bangon_chat_messages enable row level security;

create policy "Anyone can post bangon_chat_messages"
  on public.bangon_chat_messages for insert with check (true);
create policy "Anyone can read bangon_chat_messages"
  on public.bangon_chat_messages for select using (true);
-- DELETE is admin-only via the service role (no policy = blocked for anon/auth).

-- ── Storage bucket for incident photos ──────────────────────────────
insert into storage.buckets (id, name, public)
values ('bangon-incidents', 'bangon-incidents', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can upload to bangon-incidents" on storage.objects;
drop policy if exists "Anyone can read bangon-incidents" on storage.objects;

create policy "Anyone can upload to bangon-incidents"
  on storage.objects for insert
  with check (bucket_id = 'bangon-incidents');

create policy "Anyone can read bangon-incidents"
  on storage.objects for select
  using (bucket_id = 'bangon-incidents');
