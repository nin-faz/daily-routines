import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { routineStorage, getTodayString } from "@/integrations/supabase/routines";
import { Routine } from "@/types/routine";

export const useRoutines = () => {
  const queryClient = useQueryClient();
  const today = getTodayString();

  // Récupère toutes les routines
  const { data: routines = [], isLoading } = useQuery({
    queryKey: ["routines"],
    queryFn: () => routineStorage.getRoutines(),
    staleTime: 1000 * 60 * 5, // 5 minutes de cache
    gcTime: 1000 * 60 * 10, // Garde en cache 10 minutes
  });

  // Récupère uniquement les statuts du jour pour afficher les checkboxes
  const { data: statuses = [] } = useQuery({
    queryKey: ["routine-statuses", today],
    queryFn: () => routineStorage.getStatusesForDate(today),
    staleTime: 1000 * 60 * 1, // 1 minute de cache (on veut que ce soit frais)
  });

  const addRoutine = useMutation({
    mutationFn: (routineData: Omit<Routine, "id" | "createdAt">) => {
      const newRoutine: Routine = {
        ...routineData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      return routineStorage.addRoutine(newRoutine);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });

  const toggleComplete = useMutation({
    mutationFn: (routineId: string) =>
      routineStorage.toggleRoutineComplete(routineId, getTodayString()),
    onSuccess: () => {
      // Invalide à la fois les routines ET les statuts pour rafraîchir l'affichage
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      queryClient.invalidateQueries({ queryKey: ["routine-statuses"] });
    },
  });

  const skipToday = useMutation({
    mutationFn: (routineId: string) =>
      routineStorage.skipRoutineToday(routineId, getTodayString()),
    onSuccess: () => {
      // Invalide à la fois les routines ET les statuts pour rafraîchir l'affichage
      queryClient.invalidateQueries({ queryKey: ["routines"] });
      queryClient.invalidateQueries({ queryKey: ["routine-statuses"] });
    },
  });

  const updateRoutine = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Routine }) =>
      routineStorage.updateRoutine(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });

  const deleteRoutine = useMutation({
    mutationFn: (routineId: string) => routineStorage.deleteRoutine(routineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });

  return {
    routines,
    statuses,// Statuts du jour pour chaque routine (complétée, sautée...)
    isLoading,
    addRoutine,
    toggleComplete, // Marque une routine comme complétée ou annule la complétion
    skipToday, // Marque une routine comme "sautée" pour aujourd'hui
    updateRoutine,
    deleteRoutine,
  };
};
