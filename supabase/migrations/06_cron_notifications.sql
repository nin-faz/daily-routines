-- ==========================================
-- CONFIGURATION DU CRON POUR LES NOTIFICATIONS
-- ==========================================
-- Ce fichier configure pg_cron pour déclencher l'Edge Function
-- send-scheduled-notifications toutes les 15 minutes.

-- 1. Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;  -- Requis pour net.http_post

-- 2. Nettoyer le job s'il existe déjà (évite les erreurs)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-scheduled-notifications') THEN
    PERFORM cron.unschedule('send-scheduled-notifications');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignorer tout problème au cas où (table inexistante, etc.)
    NULL;
END $$;

-- 3. Créer le job cron (toutes les 15 minutes)
SELECT cron.schedule(
  'send-scheduled-notifications',
  '*/15 * * * *', -- 00, 15, 30, 45 de chaque heure
  $$
  SELECT net.http_post(
      url := 'https://gaytlowwebmmycswnshu.supabase.co/functions/v1/send-scheduled-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer REMOVED_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
