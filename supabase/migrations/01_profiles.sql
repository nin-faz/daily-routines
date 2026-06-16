-- ==========================================
-- 1. TYPES ET FONCTIONS DE BASE
-- ==========================================

-- Création du type pour les rôles 
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = 'admin'
  );
$$;

-- ==========================================
-- 2. TRIGGERS ET AUTOMATISATION
-- ==========================================

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Fonction pour l'inscription automatique (Trigger Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, pseudo, color_theme, mode_theme, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    split_part(NEW.email, '@', 1),
    'orange', 
    'system',
    'user'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Déclenchement du profil à la création de l'user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 3. SÉCURITÉ (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politique pour l'utilisateur (Gestion de son propre profil)
CREATE POLICY "Users can view own profile"
ON public.profiles FOR ALL
TO authenticated
USING (auth.uid() = id);

-- Politique spécifique pour l'ADMIN (Lecture de tous les profils)
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- ==========================================
-- 4. COLONNES ADDITIONNELLES
-- ==========================================

-- Éveil de streak : {date, streak, activatedAt} JSONB (1 revive/semaine ISO)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_streak_revive JSONB;

-- Dernier streak positif connu (cross-device, remplace localStorage prev-streak)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS prev_streak INTEGER DEFAULT 0;