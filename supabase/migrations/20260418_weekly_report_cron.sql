-- ============================================================
-- Weekly Report Cron Job
-- Run this in Supabase SQL Editor AFTER enabling the extensions:
--   Dashboard → Database → Extensions → enable pg_cron & pg_net
--
-- Replace the two placeholder values before running:
--   <YOUR_PROJECT_REF>   e.g. mepniegwjfkpeiiqfmgu
--   <YOUR_ANON_KEY>      from Dashboard → Settings → API → anon key
-- ============================================================

-- 1. Enable required extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Remove existing job if re-running this migration
SELECT cron.unschedule('weekly-financial-report')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'weekly-financial-report'
);

-- 3. Schedule the edge function every Monday at 08:00 UTC
SELECT cron.schedule(
  'weekly-financial-report',
  '0 8 * * 1',   -- cron: minute hour day-of-month month day-of-week
  $$
  SELECT
    net.http_post(
      url        := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-weekly-report',
      headers    := jsonb_build_object(
                     'Content-Type',  'application/json',
                     'Authorization', 'Bearer <YOUR_ANON_KEY>'
                   ),
      body       := '{}'::jsonb,
      timeout_milliseconds := 30000
    ) AS request_id;
  $$
);

-- 4. Verify the schedule was created
SELECT jobid, jobname, schedule, command
FROM   cron.job
WHERE  jobname = 'weekly-financial-report';
