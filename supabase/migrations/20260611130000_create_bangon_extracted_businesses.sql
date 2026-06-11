-- BangonGensan: extracted businesses from comment mining.
--
-- Holds the structured output of bangon-extract-shops (gpt-4o-mini reduces
-- raw comments into business listings), keyed by canonical name. The static
-- src/data/bangonOpenBusinesses.json is generated FROM this table during a
-- one-shot extraction — the table stays so reruns / future scrapes can
-- replace existing rows by canonical_key cleanly.
--
-- Public-read so the home sector can query it client-side if we later switch
-- from the static JSON to live data.

create table if not exists public.bangon_extracted_businesses (
  id                 uuid primary key default gen_random_uuid(),
  canonical_key      text not null unique,
  name               text not null,
  category           text,
  sells              text,
  address            text,
  opens              text,
  closes             text,
  contact            text,
  source             text not null,
  source_comment_id  text,
  source_author      text,
  source_message     text,
  source_url         text,
  osm_id             text,
  latitude           double precision,
  longitude          double precision,
  extracted_at       timestamptz not null default now()
);

create index if not exists idx_bangon_extracted_source   on public.bangon_extracted_businesses (source);
create index if not exists idx_bangon_extracted_category on public.bangon_extracted_businesses (category);

alter table public.bangon_extracted_businesses enable row level security;

create policy "Public reads extracted businesses"
  on public.bangon_extracted_businesses for select
  using (true);
