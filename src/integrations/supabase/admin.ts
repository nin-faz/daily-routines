import { supabase } from './client';

// Statistiques globales pour l'admin
export interface AdminStats {
  totalUsers: number;
  totalFolders: number;
  totalTasks: number;
    adminCount: number;
}

// Modèle de profil utilisateur pour l'admin
export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  roles: string[];
}

// Modèle de dossier pour l'admin
export interface AdminFolder {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  user_id: string;
  created_at: string;
  owner_email?: string;
  task_count: number;
}


// Récupère les statistiques admin (utilisateurs, dossiers, tâches, admins)
export async function fetchAdminStats(): Promise<AdminStats> {
  const [{ data: profiles }, { count: foldersCount }, { count: tasksCount }] = await Promise.all([
    supabase.from('profiles').select('id, role'),
    supabase.from('folders').select('id', { count: 'exact', head: true }),
    supabase.from('tasks').select('id', { count: 'exact', head: true }),
  ]);

  const totalUsers = Array.isArray(profiles) ? profiles.length : 0;
  const adminCount = Array.isArray(profiles)
    ? profiles.filter((p) => p.role === 'admin').length
    : 0;

  return {
    totalUsers,
    totalFolders: foldersCount || 0,
    totalTasks: tasksCount || 0,
    adminCount,
  };
}


// Récupère la liste des utilisateurs pour l'admin
export async function fetchAdminUsers(): Promise<UserProfile[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !profiles) return [];

  // Normalise les profils pour l'affichage admin
  return profiles.map((profile) => ({
    id: profile.id,
    user_id: profile.id,
    email: profile.email ?? '',
    display_name: profile.pseudo ?? null,
    created_at: profile.created_at,
    roles: profile.role ? [profile.role] : [],
  }));
}

/**
 * 🔒 SÉCURITÉ OPTIMALE : On utilise désormais un RPC (Remote Procedure Call).
 * Le client ne modifie plus directement la table avec un .update() vulnérable.
 */

export async function updateAdminRole(userId: string, makeAdmin: boolean): Promise<string | null> {
  try {
    const { error } = await supabase.rpc('set_user_role', {
      target_user_id: userId,
      new_role: makeAdmin ? 'admin' : 'user'
    });

    if (error) {
       console.error("Erreur RPC lors de l'update du rôle:", error);
       return error.message || "Erreur lors de la modification du rôle.";
    }

    return null; // Succès
  } catch (err: any) {
    console.error("Exception inattendue:", err);
    return "Une erreur inattendue s'est produite.";
  }
}

// Récupère la liste des dossiers avec infos propriétaires et nombre de tâches
export async function fetchAdminFolders() {
  // Récupère les dossiers
  const { data: foldersData, error: foldersError } = await supabase
    .from('folders')
    .select('*')
    .order('created_at', { ascending: false });
  if (foldersError) throw foldersError;

  // Récupère les profils pour l'info propriétaire
  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('id, email');
  const profiles = profilesRaw?.map((p) => ({
    user_id: p.id,
    email: p.email,
  })) || [];

  // Récupère les tâches pour compter par dossier
  const { data: tasks } = await supabase
    .from('tasks')
    .select('folder_id');

  // Combine les données dossiers/propriétaires/tâches
  return (
    foldersData?.map((folder) => {
      const owner = profiles?.find((p) => p.user_id === folder.user_id);
      const taskCount = tasks?.filter((t) => t.folder_id === folder.id).length || 0;
      return {
        ...folder,
        owner_email: owner?.email || 'Inconnu',
        task_count: taskCount,
      };
    }) || []
  );
}