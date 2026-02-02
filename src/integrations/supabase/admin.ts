import { supabase } from './client';

// Statistiques globales pour l'admin
export interface AdminStats {
    totalUsers: number;
    totalProjects: number;
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

// Modèle de projet pour l'admin
export interface AdminProject {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
  created_at: string;
  owner_email?: string;
  task_count: number;
}


// Récupère les statistiques admin (utilisateurs, projets, tâches, admins)
export async function fetchAdminStats(): Promise<AdminStats> {
  // Récupère profils, projets, tâches
  const [{ data: profiles }, { count: projectsCount }, { count: tasksCount }] = await Promise.all([
    supabase.from('profiles').select('id, role'),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase.from('tasks').select('id', { count: 'exact', head: true }),
  ]);

  const totalUsers = Array.isArray(profiles) ? profiles.length : 0;
  const adminCount = Array.isArray(profiles)
    ? profiles.filter((p) => p.role === 'admin').length
    : 0;

  return {
    totalUsers,
    totalProjects: projectsCount || 0,
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

// Met à jour le rôle admin d'un utilisateur (ajoute ou retire le rôle admin)
export async function updateAdminRole(userId: string, makeAdmin: boolean): Promise<string | null> {
  const { error } = await supabase
    .from('profiles')
    .update({ role: makeAdmin ? 'admin' : 'user' })
    .eq('id', userId);
  return error ? error.message : null;
}

// Récupère la liste des projets avec infos propriétaires et nombre de tâches
export async function fetchAdminProjects() {
  // Récupère les projets
  const { data: projectsData, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (projectsError) throw projectsError;

  // Récupère les profils pour l'info propriétaire
  const { data: profilesRaw } = await supabase
    .from('profiles')
    .select('id, email');
  const profiles = profilesRaw?.map((p) => ({
    user_id: p.id,
    email: p.email,
  })) || [];

  // Récupère les tâches pour compter par projet
  const { data: tasks } = await supabase
    .from('tasks')
    .select('project_id');

  // Combine les données projets/propriétaires/tâches
  return (
    projectsData?.map((project) => {
      const owner = profiles?.find((p) => p.user_id === project.user_id);
      const taskCount = tasks?.filter((t) => t.project_id === project.id).length || 0;
      return {
        ...project,
        owner_email: owner?.email || 'Inconnu',
        task_count: taskCount,
      };
    }) || []
  );
}