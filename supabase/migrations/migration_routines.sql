-- ============================================
-- MIGRATION ROUTINES - Ajout frequency/week_days
-- ============================================
-- Ce script est idempotent (peut être exécuté plusieurs fois)

-- ============================================
-- 1. CRÉER LES ENUMS (si pas existants)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'frequency_type') THEN
        CREATE TYPE frequency_type AS ENUM ('daily', 'weekly');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'time_of_day_type') THEN
        CREATE TYPE time_of_day_type AS ENUM ('morning', 'afternoon', 'evening');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'day_of_week_type') THEN
        CREATE TYPE day_of_week_type AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
    END IF;
END $$;

-- ============================================
-- 2. AJOUTER LES COLONNES MANQUANTES À routines
-- ============================================
DO $$
BEGIN
    -- Ajouter frequency (TEXT temporairement, on convertira après)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'routines' AND column_name = 'frequency'
    ) THEN
        ALTER TABLE public.routines ADD COLUMN frequency TEXT DEFAULT 'daily';
    END IF;

    -- Ajouter week_days
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'routines' AND column_name = 'week_days'
    ) THEN
        ALTER TABLE public.routines ADD COLUMN week_days TEXT[];
    END IF;

    -- Ajouter updated_at si manquant
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'routines' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.routines ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- ============================================
-- 3. METTRE À JOUR time_of_day (TEXT → ENUM)
-- ============================================
-- Approche avec colonne temporaire (plus fiable)
DO $$
BEGIN
    -- Vérifier si time_of_day est en TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'routines'
        AND column_name = 'time_of_day'
        AND data_type = 'text'
    ) THEN
        -- Créer une colonne temporaire ENUM
        ALTER TABLE public.routines ADD COLUMN time_of_day_new time_of_day_type;

        -- Copier les données valides
        UPDATE public.routines
        SET time_of_day_new =
            CASE
                WHEN time_of_day IN ('morning', 'afternoon', 'evening')
                THEN time_of_day::time_of_day_type
                ELSE NULL
            END;

        -- Supprimer l'ancienne colonne
        ALTER TABLE public.routines DROP COLUMN time_of_day;

        -- Renommer la nouvelle colonne
        ALTER TABLE public.routines RENAME COLUMN time_of_day_new TO time_of_day;
    END IF;
END $$;

-- ============================================
-- 4. CONVERTIR week_days TEXT[] → ENUM[]
-- ============================================
-- Approche avec colonne temporaire (plus fiable)
DO $$
BEGIN
    -- Vérifier si week_days est en TEXT[]
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'routines'
        AND column_name = 'week_days'
        AND data_type = 'ARRAY'
        AND udt_name = '_text'
    ) THEN
        -- Créer une colonne temporaire ENUM[]
        ALTER TABLE public.routines ADD COLUMN week_days_new day_of_week_type[];

        -- Copier les données en filtrant les valeurs valides
        UPDATE public.routines
        SET week_days_new =
            CASE
                WHEN week_days IS NOT NULL THEN
                    ARRAY(
                        SELECT elem::day_of_week_type
                        FROM unnest(week_days) AS elem
                        WHERE elem IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
                    )
                ELSE NULL
            END;

        -- Supprimer l'ancienne colonne
        ALTER TABLE public.routines DROP COLUMN week_days;

        -- Renommer la nouvelle colonne
        ALTER TABLE public.routines RENAME COLUMN week_days_new TO week_days;
    END IF;
END $$;

-- ============================================
-- 5. AJOUTER LES CONTRAINTES (sauf week_days_when_weekly)
-- ============================================

-- Contrainte sur notification_time (format HH:MM)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'check_notification_time_format'
    ) THEN
        ALTER TABLE public.routines
        ADD CONSTRAINT check_notification_time_format
        CHECK (notification_time IS NULL OR notification_time ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$');
    END IF;
END $$;

-- ============================================
-- 6. CONVERTIR frequency TEXT → ENUM
-- ============================================
-- Approche avec colonne temporaire (plus fiable)
DO $$
BEGIN
    -- Vérifier si frequency est encore en TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'routines'
        AND column_name = 'frequency'
        AND data_type = 'text'
    ) THEN
        -- Créer une colonne temporaire ENUM
        ALTER TABLE public.routines ADD COLUMN frequency_new frequency_type;

        -- Copier les données valides
        UPDATE public.routines
        SET frequency_new =
            CASE
                WHEN frequency IN ('daily', 'weekly')
                THEN frequency::frequency_type
                ELSE 'daily'::frequency_type
            END;

        -- Supprimer l'ancienne colonne (avec son DEFAULT TEXT)
        ALTER TABLE public.routines DROP COLUMN frequency;

        -- Renommer la nouvelle colonne
        ALTER TABLE public.routines RENAME COLUMN frequency_new TO frequency;

        -- Ajouter le DEFAULT et NOT NULL avec le bon type ENUM
        ALTER TABLE public.routines ALTER COLUMN frequency SET DEFAULT 'daily'::frequency_type;
        ALTER TABLE public.routines ALTER COLUMN frequency SET NOT NULL;
    END IF;
END $$;

-- ============================================
-- 7. AJOUTER LA CONTRAINTE week_days (après conversion frequency)
-- ============================================
-- Contrainte: si weekly, week_days obligatoire
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'check_week_days_when_weekly'
    ) THEN
        ALTER TABLE public.routines
        ADD CONSTRAINT check_week_days_when_weekly
        CHECK (frequency != 'weekly' OR (week_days IS NOT NULL AND array_length(week_days, 1) > 0));
    END IF;
END $$;

-- ============================================
-- 8. AJOUTER LES INDEXES MANQUANTS
-- ============================================

-- Index sur frequency
CREATE INDEX IF NOT EXISTS idx_routines_frequency
ON public.routines(frequency);

-- Index composite user_id + date sur routine_statuses (optimise les queries fréquentes)
CREATE INDEX IF NOT EXISTS idx_routine_statuses_user_date
ON public.routine_statuses(user_id, date);

-- ============================================
-- 9. CRÉER LE TRIGGER updated_at SI MANQUANT
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_routines_updated_at'
    ) THEN
        CREATE TRIGGER update_routines_updated_at
        BEFORE UPDATE ON public.routines
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- 10. MIGRER routine_statuses (status TEXT → completed/skipped BOOLEAN)
-- ============================================
-- IMPORTANT: Cette migration transforme la colonne "status" en colonnes "completed" et "skipped"

DO $$
BEGIN
    -- Vérifier si la colonne "status" existe encore (ancienne structure)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'routine_statuses'
        AND column_name = 'status'
        AND data_type = 'text'
    ) THEN
        -- Ajouter les nouvelles colonnes
        ALTER TABLE public.routine_statuses
        ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;

        ALTER TABLE public.routine_statuses
        ADD COLUMN IF NOT EXISTS skipped BOOLEAN DEFAULT false;

        ALTER TABLE public.routine_statuses
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

        -- Désactiver les triggers utilisateur temporairement (pas les triggers système)
        ALTER TABLE public.routine_statuses DISABLE TRIGGER USER;

        -- Migrer les données
        UPDATE public.routine_statuses
        SET
            completed = (status = 'completed'),
            skipped = (status = 'skipped'),
            completed_at = CASE WHEN status = 'completed' THEN created_at ELSE NULL END;

        -- Réactiver les triggers utilisateur
        ALTER TABLE public.routine_statuses ENABLE TRIGGER USER;

        -- Supprimer l'ancienne colonne status
        ALTER TABLE public.routine_statuses
        DROP COLUMN status;

        -- Ajouter les contraintes NOT NULL maintenant que les données sont migrées
        ALTER TABLE public.routine_statuses
        ALTER COLUMN completed SET NOT NULL;

        ALTER TABLE public.routine_statuses
        ALTER COLUMN skipped SET NOT NULL;

        RAISE NOTICE 'Migration de routine_statuses.status → completed/skipped effectuée ✅';
    ELSE
        RAISE NOTICE 'routine_statuses déjà migrée (colonnes completed/skipped existent) ✅';
    END IF;
END $$;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
-- Vérification finale
SELECT 'Migration terminée ✅' AS status;

-- Afficher la structure finale
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'routines'
AND table_schema = 'public'
ORDER BY ordinal_position;
