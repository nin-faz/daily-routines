import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { routineStorage, getTodayString } from "@/integrations/supabase/routines";
import { Routine, RoutineStatus } from "@/types/routine";
import { toast } from "sonner";

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
    mutationFn: (routineData: Omit<Routine, "id" | "createdAt" | "userId" | "updatedAt">) => {
      const newRoutine: Routine = {
        ...routineData,
        id: crypto.randomUUID(),
        userId: "", // Sera remplacé par le trigger de la base de données
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return routineStorage.addRoutine(newRoutine);
    },
    onMutate: async (routineData: Omit<Routine, "id" | "createdAt" | "userId" | "updatedAt">) => {
      // Annule les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ["routines"] });

      // Snapshot de l'état actuel
      const previousRoutines = queryClient.getQueryData<Routine[]>(["routines"]);

      // Update optimiste : ajoute la nouvelle routine immédiatement
      const newRoutine: Routine = {
        ...routineData,
        id: crypto.randomUUID(),
        userId: "", // Sera remplacé par le trigger de la base de données
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Routine[]>(["routines"], (old = []) => [...old, newRoutine]);

      return { previousRoutines };
    },
    onError: (_err, _routineData, context) => {
      // En cas d'erreur, rollback
      if (context?.previousRoutines) {
        queryClient.setQueryData(["routines"], context.previousRoutines);
      }
    },
    onSuccess: () => {
      // Refetch pour synchroniser avec la base de données
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });

  const toggleComplete = useMutation({
    mutationFn: (routineId: string) =>
      routineStorage.toggleRoutineComplete(routineId, getTodayString()),
    // Optimistic update pour un feedback instantané
    onMutate: async (routineId: string) => {
      // Annule les requêtes en cours pour éviter qu'elles écrasent notre update optimiste
      await queryClient.cancelQueries({ queryKey: ["routine-statuses", today] });
      
      // Snapshot de l'état actuel pour pouvoir rollback en cas d'erreur
      const previousStatuses = queryClient.getQueryData<typeof statuses>(["routine-statuses", today]);
      
      // Update optimiste : met à jour immédiatement l'UI
      queryClient.setQueryData<RoutineStatus[]>(["routine-statuses", today], (old = []) => {
        const existingStatus = old.find(s => s.routineId === routineId);

        if (existingStatus) {
          // Si le statut existe, toggle la complétion ET force skipped à false
          return old.map(s =>
            s.routineId === routineId
              ? {
                  ...s,
                  completed: !s.completed,
                  skipped: false,
                  completedAt: !s.completed ? new Date().toISOString() : undefined,
                }
              : s
          );
        } else {
          // Si pas de statut, crée un nouveau statut complété
          return [
            ...old,
            {
              id: crypto.randomUUID(),
              routineId,
              date: today,
              completed: true,
              skipped: false,
              completedAt: new Date().toISOString(),
              userId: "", // Valeur par défaut ou à ajuster selon votre logique
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as RoutineStatus,
          ];
        }
      });
      
      return { previousStatuses };
    },
    // En cas d'erreur, rollback vers l'état précédent
    onError: (_err, _routineId, context) => {
      if (context?.previousStatuses) {
        queryClient.setQueryData(["routine-statuses", today], context.previousStatuses);
      }
      toast.error("Impossible de modifier le statut. Veuillez réessayer.");
    },
    // Dans tous les cas, refetch pour synchroniser avec le serveur
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: ["routine-statuses", today] });
      queryClient.invalidateQueries({ queryKey: ["routine-statuses"] });
    },
  });

  const skipToday = useMutation({
    mutationFn: (routineId: string) =>
      routineStorage.skipRoutineToday(routineId, getTodayString()),
    // Optimistic update pour un feedback instantané
    onMutate: async (routineId: string) => {
      await queryClient.cancelQueries({ queryKey: ["routine-statuses", today] });
      
      const previousStatuses = queryClient.getQueryData<typeof statuses>(["routine-statuses", today]);
      
      queryClient.setQueryData<typeof statuses>(["routine-statuses", today], (old = []) => {
        const existingStatus = old.find(s => s.routineId === routineId);
        
        if (existingStatus) {
          // Toggle le statut "skipped" ET force completed à false + supprime completedAt
          return old.map(s => 
            s.routineId === routineId 
              ? { ...s, skipped: !s.skipped, completed: false, completedAt: undefined }
              : s
          );
        } else {
          // Crée un nouveau statut "skipped"
          return [
            ...old,
            {
              id: crypto.randomUUID(),
              routineId,
              date: today,
              completed: false,
              skipped: true,
              userId: "", // Valeur par défaut ou à ajuster selon votre logique
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as RoutineStatus,
          ];
        }
      });
      
      return { previousStatuses };
    },
    onError: (_err, _routineId, context) => {
      if (context?.previousStatuses) {
        queryClient.setQueryData(["routine-statuses", today], context.previousStatuses);
      }
      toast.error("Impossible de modifier le statut. Veuillez réessayer.");
    },
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: ["routine-statuses", today] });
      queryClient.invalidateQueries({ queryKey: ["routine-statuses"] });
    },
  });

  const updateRoutine = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Routine }) =>
      routineStorage.updateRoutine(id, data),
    // Optimistic update : modification instantanée dans l'UI
    onMutate: async ({ id, data }) => {
      // Annule les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ["routines"] });
      
      // Snapshot pour rollback
      const previousRoutines = queryClient.getQueryData<Routine[]>(["routines"]);
      
      // Met à jour immédiatement la routine dans l'UI
      queryClient.setQueryData<Routine[]>(["routines"], (old = []) =>
        old.map(routine => routine.id === id ? data : routine)
      );
      
      return { previousRoutines };
    },
    // En cas d'erreur, restaure l'état précédent
    onError: (_err, _variables, context) => {
      if (context?.previousRoutines) {
        queryClient.setQueryData(["routines"], context.previousRoutines);
      }
      toast.error("Impossible de modifier la routine. Veuillez réessayer.");
    },
    // Resynchronise avec le serveur
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
  });

  const deleteRoutine = useMutation({
    mutationFn: (routineId: string) => routineStorage.deleteRoutine(routineId),
    // Optimistic update : suppression instantanée de l'UI
    onMutate: async (routineId: string) => {
      // Annule les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ["routines"] });
      
      // Snapshot pour rollback
      const previousRoutines = queryClient.getQueryData<Routine[]>(["routines"]);
      
      // Supprime immédiatement la routine de l'UI
      queryClient.setQueryData<Routine[]>(["routines"], (old = []) => 
        old.filter(routine => routine.id !== routineId)
      );
      
      return { previousRoutines };
    },
    // En cas d'erreur, restaure la liste et affiche une notification
    onError: (_err, _routineId, context) => {
      if (context?.previousRoutines) {
        queryClient.setQueryData(["routines"], context.previousRoutines);
      }
      toast.error("Impossible de supprimer la routine. Veuillez réessayer.");
    },
    // Resynchronise avec le serveur
    onSettled: () => {
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
