-- ==========================================
-- 1. TRIGGER
-- ==========================================

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- 2. SÉCURITÉ (RLS)
-- ==========================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Politique utilisateur (FOR ALL pour gérer ses propres tâches)
CREATE POLICY "Users can manage their own tasks"
ON public.tasks FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Politique Admin (Lecture seule pour l'administration)
CREATE POLICY "Admins can view all tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));