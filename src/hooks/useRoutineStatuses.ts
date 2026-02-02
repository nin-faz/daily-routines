import { useQuery } from "@tanstack/react-query";
import { routineStorage } from "@/integrations/supabase/routines";

/**
 * Hook pour récupérer et mettre en cache les statuts d'une routine donnée.
 * Clé de cache: ["routine-statuses", routineId]
 */
export const useRoutineStatuses = (routineId?: string) => {
  const query = useQuery({
    queryKey: ["routine-statuses", routineId],
    queryFn: async () => {
      if (!routineId) return [];
      const statuses = await routineStorage.getStatuses();
      return statuses.filter((s) => s.routineId === routineId);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!routineId,
  });

  return {
    statuses: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};

export default useRoutineStatuses;
