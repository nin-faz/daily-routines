-- ==========================================
-- 1. TRIGGERS (Pour updated_at)
-- ==========================================

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- 2. SÉCURITÉ (RLS)
-- ==========================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own projects"
ON public.projects FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Politique pour l'admin (Lecture seule de tous les projets)
CREATE POLICY "Admins can view all projects"
ON public.projects FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));