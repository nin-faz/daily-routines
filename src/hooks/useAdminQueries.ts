import { useQuery } from '@tanstack/react-query';
import { fetchAdminStats, fetchAdminUsers, fetchAdminProjects } from '@/integrations/supabase/admin';

// Récupère les statistiques admin avec cache React Query
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => fetchAdminStats(),
    staleTime: 30 * 1000, // 30 secondes
  });
}

// Récupère la liste des utilisateurs admin avec cache React Query
export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
    staleTime: 30 * 1000, // 30 secondes
  });
}

// Récupère la liste des projets avec infos propriétaires et nombre de tâches, avec cache React Query
export function useAdminProjects() {
  return useQuery({
    queryKey: ['admin-projects'],
    queryFn: fetchAdminProjects,
    staleTime: 30 * 1000, // 30 secondes
  });
}
