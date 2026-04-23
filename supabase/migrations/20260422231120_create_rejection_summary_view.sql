-- Rejection summary view for admin dashboard / debugging.
-- Shows rejection counts by reason over last 7 days.

create or replace view public.sync_rejection_summary as
select
  reason,
  count(*) as total,
  count(*) filter (where created_at > now() - interval '24 hours') as last_24h,
  count(*) filter (where created_at > now() - interval '7 days') as last_7d,
  max(created_at) as last_seen
from public.sync_rejections
group by reason
order by total desc;

comment on view public.sync_rejection_summary is
  'Aggregated rejection counts by reason. Used by admin dashboard to monitor pipeline health.';
