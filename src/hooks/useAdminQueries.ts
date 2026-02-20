import { useQuery } from '@tanstack/react-query';
import { fetchAdminStats, fetchAdminUsers, fetchAdminFolders } from '@/integrations/supabase/admin';

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

// Récupère la liste des dossiers avec infos propriétaires et nombre de tâches, avec cache React Query
export function useAdminFolders() {
  return useQuery({
    queryKey: ['admin-folders'],
    queryFn: fetchAdminFolders,
    staleTime: 30 * 1000, // 30 secondes
  });
}


