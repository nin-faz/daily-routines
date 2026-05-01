-- ==========================================
-- CRON JOB — RÉSUMÉ HEBDOMADAIRE (DIMANCHE 18H UTC)
-- ==========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-weekly-summary') THEN
    PERFORM cron.unschedule('send-weekly-summary');
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'send-weekly-summary',
  '0 18 * * 0', -- Dimanche 18h00 UTC (20h Paris)
  $$
  SELECT net.http_post(
      url := 'https://gaytlowwebmmycswnshu.supabase.co/functions/v1/send-weekly-summary',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer 0KvCkHD+f5Cute/d6wYDYIFD60ygoK5kHGd2DbMP610='
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
