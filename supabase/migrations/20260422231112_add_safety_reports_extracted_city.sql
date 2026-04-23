-- Phase 2: Add extracted_city and landmark columns to safety_reports
-- Supports the is_gensan gate and landmark geocoding tier.

alter table public.safety_reports
  add column if not exists extracted_city text,
  add column if not exists landmark text;

comment on column public.safety_reports.extracted_city is
  'City name extracted by classifier. Used for geographic validation (is_gensan gate).';
comment on column public.safety_reports.landmark is
  'Landmark name extracted by classifier. Used for landmark-tier geocoding.';
