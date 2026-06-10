-- BangonGensan social-media disaster reports.
--
-- Output table for the bangon-social-sync edge function — scrapes Facebook via
-- Regiment for disaster / relief / earthquake events in GenSan, classifies with
-- OpenAI, geocodes, and upserts here.
--
-- DELIBERATELY SEPARATE from public.safety_reports. The smart-map safety
-- pipeline writes its own rows there; BangonGensan rows live here so their
-- lifecycle, freshness, and admin surface stay independent.

-- ── Table ───────────────────────────────────────────────────────────
create table if not exists public.bangon_social_reports (
  id uuid primary key default gen_random_uuid(),

  -- Provenance
  external_id text not null,                       -- Facebook post_id
  source text not null check (source in (
    'facebook-disaster-pages',
    'facebook-disaster-search'
  )),
  source_page_id text,
  source_page_name text,
  source_query text,

  -- OpenAI classification
  category text,                                   -- Earthquake | Flood | Typhoon | Landslide | Fire Disaster | Power Outage | Water Shortage | Evacuation | Relief Operation | Other
  severity text check (severity is null or severity in ('low', 'medium', 'high')),
  headline text,
  summary text,
  message text,                                    -- raw FB message (truncated to 4000)
  message_url text,
  author_name text,
  author_url text,
  image_url text,
  video_url text,
  reactions_count integer default 0,
  comments_count integer default 0,
  shares_count integer default 0,

  -- Geographic
  barangay text,
  latitude double precision,
  longitude double precision,
  location_confidence text,                        -- high | medium | low | none
  geocode_source text,                             -- nominatim | landmark | barangay_centroid | unresolved | out_of_bbox | skipped
  extracted_city text,
  landmark text,

  -- Timestamps
  posted_at timestamptz,                           -- when the FB post was published
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),

  -- Workflow
  verified boolean not null default false,         -- true for curated-page rows, false for search results
  archive_status text not null default 'active' check (archive_status in ('active', 'archived')),

  raw_payload jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (external_id, source)
);

create index if not exists idx_bangon_social_posted        on public.bangon_social_reports (posted_at desc);
create index if not exists idx_bangon_social_archive       on public.bangon_social_reports (archive_status);
create index if not exists idx_bangon_social_category      on public.bangon_social_reports (category);
create index if not exists idx_bangon_social_barangay      on public.bangon_social_reports (barangay);
create index if not exists idx_bangon_social_coords        on public.bangon_social_reports (latitude, longitude) where latitude is not null;
create index if not exists idx_bangon_social_last_synced   on public.bangon_social_reports (last_synced_at desc);

-- ── RLS ─────────────────────────────────────────────────────────────
alter table public.bangon_social_reports enable row level security;

-- Public reads only see active rows that successfully geocoded — keeps the
-- BangonGensan map clean of incomplete/unresolved entries. Admins/service role
-- bypass RLS for review and reconciliation.
create policy "Public reads geocoded bangon_social_reports"
  on public.bangon_social_reports for select
  using (archive_status = 'active' and latitude is not null and longitude is not null);

-- Writes are service-role only (the edge function uses the service key, which
-- bypasses RLS). No INSERT/UPDATE/DELETE policies for anon/authenticated.

-- ── updated_at trigger ──────────────────────────────────────────────
create or replace function public.set_bangon_social_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_bangon_social_updated_at on public.bangon_social_reports;
create trigger trg_bangon_social_updated_at
  before update on public.bangon_social_reports
  for each row execute function public.set_bangon_social_updated_at();

-- ── Register sources for the admin pipeline ─────────────────────────
-- Mirrors how facebook-safety-pages / facebook-safety-search are registered.
insert into public.sources (slug, name, type, expected_ttl_minutes, is_paused, created_at)
values
  ('facebook-disaster-pages',  'BangonGensan — Facebook curated pages',  'social', 30, false, now()),
  ('facebook-disaster-search', 'BangonGensan — Facebook keyword search', 'social', 30, false, now())
on conflict (slug) do nothing;

-- ── pg_cron schedules ───────────────────────────────────────────────
-- Pages mode runs at :00 and :30 past the hour.
-- Search mode runs at :15 and :45 past the hour (staggered to avoid hitting
-- Regiment with both modes simultaneously).
-- Both effectively refresh every 30 minutes.
select cron.schedule(
  'bangon-social-sync-pages',
  '0,30 * * * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/bangon-social-sync?mode=pages',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.anon_key'),
      'Content-Type', 'application/json'
    ),
    body := '{"trigger":"schedule"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

select cron.schedule(
  'bangon-social-sync-search',
  '15,45 * * * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/bangon-social-sync?mode=search',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.anon_key'),
      'Content-Type', 'application/json'
    ),
    body := '{"trigger":"schedule"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
