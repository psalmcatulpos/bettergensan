-- Phase 2: Add geocode_source column to safety_reports
-- Tracks HOW a coordinate was resolved: nominatim | landmark | barangay_centroid | null
-- This lets us audit geocoding quality without checking location_confidence alone.

alter table public.safety_reports
  add column if not exists geocode_source text;

comment on column public.safety_reports.geocode_source is
  'How the lat/lng was resolved: nominatim, landmark, barangay_centroid, or null if unresolved.';

-- Backfill existing rows: anything with coords and confidence=medium is barangay_centroid
-- (Phase 1 findings: zero Nominatim successes, all mapped points are centroids)
update public.safety_reports
set geocode_source = 'barangay_centroid'
where latitude is not null and geocode_source is null;
