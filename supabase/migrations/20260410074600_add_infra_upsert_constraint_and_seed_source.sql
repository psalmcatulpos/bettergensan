
-- Unique constraint needed by bisto-sync upsert
ALTER TABLE public.infrastructure_projects
  ADD CONSTRAINT infrastructure_projects_external_id_source_key
  UNIQUE (external_id, source);

-- Seed the bisto-infrastructure source row
INSERT INTO public.sources (slug, name, type, base_url, domain, expected_ttl_minutes, schedule_cron, notes)
VALUES (
  'bisto-infrastructure',
  'Bisto.ph Infrastructure Projects',
  'api',
  'https://search2.bettergov.ph/multi-search',
  'bettergov.ph',
  1440,
  '0 3 * * *',
  'DPWH infrastructure projects via BetterGov Meilisearch. Scoped to Region XII / GenSan.'
);
