-- ==========================================
-- 1. TRIGGERS (Pour updated_at)
-- ==========================================

-- Création du trigger pour la table routines
CREATE TRIGGER update_routines_updated_at
    BEFORE UPDATE ON public.routines
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Création du trigger pour la table routine_statuses
CREATE TRIGGER update_routine_statuses_updated_at
    BEFORE UPDATE ON public.routine_statuses
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- 2. SÉCURITÉ (RLS)
-- ==========================================

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_statuses ENABLE ROW LEVEL SECURITY;

-- Politiques pour routines (Simplifiées en une seule règle 'ALL')
CREATE POLICY "Users can manage their own routines"
ON public.routines FOR ALL
USING (auth.uid() = user_id);

-- Politiques pour routine_statuses
CREATE POLICY "Users can manage their own routine statuses"
ON public.routine_statuses FOR ALL
USING (auth.uid() = user_id);