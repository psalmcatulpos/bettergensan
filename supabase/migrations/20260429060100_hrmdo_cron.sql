-- Daily HRMDO scrape at 05:20 UTC (13:20 PHT), staggered after other scrapers.
select cron.schedule(
  'hrmdo-daily-refresh',
  '20 5 * * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/hrmdo-refresh',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.anon_key'),
      'Content-Type', 'application/json'
    ),
    body := '{"trigger":"schedule"}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
