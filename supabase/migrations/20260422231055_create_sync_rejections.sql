-- Phase 1: Observability — sync_rejections table
-- Logs every dropped post so we can tune filters without guessing.

create table if not exists public.sync_rejections (
  id            bigint generated always as identity primary key,
  external_id   text not null,
  source        text not null,                -- facebook-page | facebook-search
  source_page_name text,
  source_query  text,
  reason        text not null,                -- blocklist | non_gensan_keyword | not_news | not_incident | out_of_bbox | city_mismatch | low_confidence | geocode_failed
  extracted_city text,                        -- city name extracted by classifier
  extracted_location text,                    -- location_text from classifier
  latitude      double precision,
  longitude     double precision,
  post_preview  text,                         -- first 200 chars of message
  created_at    timestamptz not null default now()
);

-- Index for analyzing rejection patterns
create index idx_sync_rejections_reason on public.sync_rejections (reason);
create index idx_sync_rejections_created on public.sync_rejections (created_at desc);
create index idx_sync_rejections_source on public.sync_rejections (source);

-- Auto-prune old rejection logs (keep 30 days)
-- Can be called by pg_cron: SELECT prune_sync_rejections();
create or replace function public.prune_sync_rejections()
returns void language sql security definer as $$
  delete from public.sync_rejections
  where created_at < now() - interval '30 days';
$$;

-- RLS: public read for dashboard, service_role write for edge functions
alter table public.sync_rejections enable row level security;

create policy "sync_rejections_public_read"
  on public.sync_rejections for select
  using (true);

create policy "sync_rejections_service_write"
  on public.sync_rejections for all
  using (auth.role() = 'service_role');

comment on table public.sync_rejections is
  'Logs every post dropped by the facebook-safety-sync pipeline. Used to tune classification and geocoding filters. Auto-pruned after 30 days.';
