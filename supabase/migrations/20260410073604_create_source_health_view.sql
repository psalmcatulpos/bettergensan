
create or replace view public.source_health as
select
  s.id as source_id,
  s.slug,
  s.name,
  s.type,
  s.domain,
  s.base_url,
  s.schedule_cron,
  s.expected_ttl_minutes,
  s.is_active,
  s.is_paused,
  s.fallback_mode,
  (select max(r.finished_at) from public.scrape_runs r where r.source_id = s.id and r.status = 'success') as last_success_at,
  (select r.duration_ms from public.scrape_runs r where r.source_id = s.id and r.status = 'success' order by r.finished_at desc limit 1) as last_success_duration_ms,
  (select max(r.finished_at) from public.scrape_runs r where r.source_id = s.id and r.status = 'failed') as last_failure_at,
  (select r.error_message from public.scrape_runs r where r.source_id = s.id and r.status = 'failed' order by r.finished_at desc limit 1) as last_failure_message,
  (select count(*) from public.scrape_runs r where r.source_id = s.id and r.started_at > now() - interval '24 hours')::int as runs_24h,
  (select count(*) from public.scrape_runs r where r.source_id = s.id and r.status = 'success' and r.started_at > now() - interval '24 hours')::int as successes_24h,
  (select avg(r.duration_ms) from public.scrape_runs r where r.source_id = s.id and r.status = 'success' and r.started_at > now() - interval '24 hours') as avg_duration_ms_24h,
  (select avg(r.records_total) from public.scrape_runs r where r.source_id = s.id and r.status = 'success' and r.started_at > now() - interval '24 hours') as avg_records_24h,
  (select count(*) from public.scrape_alerts a where a.source_id = s.id and a.resolved_at is null)::int as open_alerts,
  case
    when s.is_paused then 'paused'
    when not s.is_active then 'inactive'
    when (select max(r.finished_at) from public.scrape_runs r where r.source_id = s.id and r.status = 'success') is null then 'offline'
    when now() - (select max(r.finished_at) from public.scrape_runs r where r.source_id = s.id and r.status = 'success') > make_interval(mins => s.expected_ttl_minutes * 2) then 'offline'
    when now() - (select max(r.finished_at) from public.scrape_runs r where r.source_id = s.id and r.status = 'success') > make_interval(mins => s.expected_ttl_minutes) then 'stale'
    else 'fresh'
  end as freshness_status
from public.sources s;
