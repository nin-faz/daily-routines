import { useQuery } from "@tanstack/react-query";
import { routineStorage } from "@/data/repositories/routines";
import { useAuth } from "@/application/context/AuthContext";

export const useRoutineStatuses = (routineId?: string) => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["routine-statuses", user?.id, routineId],
    queryFn: async () => {
      if (!routineId) return [];
      const statuses = await routineStorage.getStatuses();
      return statuses.filter((s) => s.routineId === routineId);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!routineId && !!user?.id,
  });

  return {
    statuses: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};

export default useRoutineStatuses;
