-- ==========================================
-- CONFIGURATION DU CRON POUR LES NOTIFICATIONS
-- ==========================================
-- Ce fichier configure pg_cron pour déclencher l'Edge Function
-- send-routine-notifications toutes les 15 minutes.

-- 1. Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;  -- Requis pour net.http_post

-- 2. Nettoyer le job s'il existe déjà (évite les erreurs)
DO $$
BEGIN
    -- Vérifier d'abord si le job existe dans la table de pg_cron
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-routine-notifications') THEN
        PERFORM cron.unschedule('send-routine-notifications');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignorer tout problème au cas où (table inexistante, etc.)
        NULL;
END $$;

-- 3. Créer le job cron (toutes les 15 minutes)
SELECT cron.schedule(
  'send-routine-notifications',
  '*/15 * * * *', -- 00, 15, 30, 45 de chaque heure
  $$
  SELECT net.http_post(
      url := 'https://gaytlowwebmmycswnshu.supabase.co/functions/v1/send-routine-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer REMOVED_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
