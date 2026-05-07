import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { routineStorage } from "@/data/repositories/routines";
import { Routine, RoutineStatus } from "@/shared/types/routine";
import { toast } from "sonner";
import { getTodayString } from "@/shared/lib/date";
import { useAuth } from "@/application/context/AuthContext";
import { buildRoutine } from "@/domain/builders";

export const useRoutines = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const today = getTodayString();

  /**
   * Utiliser une clé de requête spécifique à l'utilisateur pour éviter les conflits entre les utilisateurs
   * qui se connectent sur le même appareil ou dans des onglets différents.
   */
  const queryKey = ["routines", user?.id];
  const statusesQueryKey = ["routine-statuses", user?.id, today];

  // Récupère toutes les routines
  const { data: routines = [], isLoading } = useQuery({
    queryKey: queryKey,
    queryFn: () => routineStorage.getRoutines(),
    staleTime: 1000 * 60 * 5, // 5 minutes de cache
    gcTime: 1000 * 60 * 10, // Garde en cache 10 minutes
  });

  const activeRoutines = routines.filter((routine) => !routine.isArchived);
  const archivedRoutines = routines.filter((routine) => routine.isArchived);

  // Récupère uniquement les statuts du jour pour afficher les checkboxes
  const { data: statuses = [] } = useQuery({
    queryKey: statusesQueryKey,
    queryFn: () => routineStorage.getStatusesForDate(today),
    // On ne lance la requête QUE si l'utilisateur est connu
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 1, // 1 minute de cache (on veut que ce soit frais)
  });

  const addRoutine = useMutation({
    mutationFn: (
      routineData: Omit<Routine, "id" | "createdAt" | "userId" | "updatedAt">,
    ) => routineStorage.addRoutine(buildRoutine(routineData, user?.id || "")),
    onMutate: async (
      routineData: Omit<Routine, "id" | "createdAt" | "userId" | "updatedAt">,
    ) => {
      await queryClient.cancelQueries({ queryKey: queryKey });
      const previousRoutines = queryClient.getQueryData<Routine[]>(queryKey);
      queryClient.setQueryData<Routine[]>(queryKey, (old = []) => [
        ...old,
        buildRoutine(routineData, user?.id || ""),
      ]);
      return { previousRoutines };
    },
    onError: (_err, _routineData, context) => {
      // En cas d'erreur, rollback
      if (context?.previousRoutines) {
        queryClient.setQueryData(queryKey, context.previousRoutines);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });

  const toggleComplete = useMutation({
    mutationFn: (routineId: string) =>
      routineStorage.toggleRoutineComplete(routineId, getTodayString()),
    // Optimistic update pour un feedback instantané
    onMutate: async (routineId: string) => {
      // Annule les requêtes en cours pour éviter qu'elles écrasent notre update optimiste
      await queryClient.cancelQueries({ queryKey: statusesQueryKey });

      // Snapshot de l'état actuel pour pouvoir rollback en cas d'erreur
      const previousStatuses =
        queryClient.getQueryData<typeof statuses>(statusesQueryKey);

      // Update optimiste : met à jour immédiatement l'UI
      queryClient.setQueryData<RoutineStatus[]>(
        statusesQueryKey,
        (old = []) => {
          const existingStatus = old.find((s) => s.routineId === routineId);

          if (existingStatus) {
            // Si le statut existe, toggle la complétion ET force skipped à false
            return old.map((s) =>
              s.routineId === routineId
                ? {
                    ...s,
                    completed: !s.completed,
                    skipped: false,
                    completedAt: !s.completed
                      ? new Date().toISOString()
                      : undefined,
                  }
                : s,
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
                userId: user?.id || "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              } as RoutineStatus,
            ];
          }
        },
      );

      return { previousStatuses };
    },
    // En cas d'erreur, rollback vers l'état précédent
    onError: (_err, _routineId, context) => {
      if (context?.previousStatuses) {
        queryClient.setQueryData(statusesQueryKey, context.previousStatuses);
      }
      toast.error("Impossible de modifier le statut. Veuillez réessayer.");
    },
    onSuccess: () => {
      localStorage.setItem("last-active", today);
    },
    // Dans tous les cas, refetch pour synchroniser avec le serveur
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: statusesQueryKey });
      queryClient.invalidateQueries({ queryKey: ["routine-statuses"] });
      queryClient.invalidateQueries({ queryKey: ["completion-rates"] });
    },
  });

  const skipToday = useMutation({
    mutationFn: (routineId: string) =>
      routineStorage.skipRoutineToday(routineId, getTodayString()),
    // Optimistic update pour un feedback instantané
    onMutate: async (routineId: string) => {
      await queryClient.cancelQueries({ queryKey: statusesQueryKey });

      const previousStatuses =
        queryClient.getQueryData<typeof statuses>(statusesQueryKey);

      queryClient.setQueryData<typeof statuses>(
        statusesQueryKey,
        (old = []) => {
          const existingStatus = old.find((s) => s.routineId === routineId);

          if (existingStatus) {
            // Toggle le statut "skipped" ET force completed à false + supprime completedAt
            return old.map((s) =>
              s.routineId === routineId
                ? {
                    ...s,
                    skipped: !s.skipped,
                    completed: false,
                    completedAt: undefined,
                  }
                : s,
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
                userId: user?.id || "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              } as RoutineStatus,
            ];
          }
        },
      );

      return { previousStatuses };
    },
    onError: (_err, _routineId, context) => {
      if (context?.previousStatuses) {
        queryClient.setQueryData(statusesQueryKey, context.previousStatuses);
      }
      toast.error("Impossible de modifier le statut. Veuillez réessayer.");
    },
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: statusesQueryKey });
      queryClient.invalidateQueries({ queryKey: ["routine-statuses"] });
      // queryClient.invalidateQueries({ queryKey: ["completion-rates"] });
    },
  });

  const updateRoutine = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Routine> }) =>
      routineStorage.updateRoutine(id, updates),
    // Optimistic update : modification instantanée dans l'UI
    onMutate: async ({ id, updates }) => {
      // Annule les requêtes en cours
      await queryClient.cancelQueries({ queryKey: queryKey });

      // Snapshot pour rollback
      const previousRoutines = queryClient.getQueryData<Routine[]>(queryKey);

      // Met à jour immédiatement la routine dans l'UI
      queryClient.setQueryData<Routine[]>(queryKey, (old = []) =>
        old.map((routine) =>
          routine.id === id ? { ...routine, ...updates } : routine,
        ),
      );

      return { previousRoutines };
    },
    // En cas d'erreur, restaure l'état précédent
    onError: (_err, _variables, context) => {
      if (context?.previousRoutines) {
        queryClient.setQueryData(queryKey, context.previousRoutines);
      }
      toast.error("Impossible de modifier la routine. Veuillez réessayer.");
    },
    // Resynchronise avec le serveur
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });

  const deleteRoutine = useMutation({
    mutationFn: (routineId: string) => routineStorage.deleteRoutine(routineId),
    // Optimistic update : suppression instantanée de l'UI
    onMutate: async (routineId: string) => {
      // Annule les requêtes en cours
      await queryClient.cancelQueries({ queryKey: queryKey });

      // Snapshot pour rollback
      const previousRoutines = queryClient.getQueryData<Routine[]>(queryKey);

      // Supprime immédiatement la routine de l'UI
      queryClient.setQueryData<Routine[]>(queryKey, (old = []) =>
        old.filter((routine) => routine.id !== routineId),
      );

      return { previousRoutines };
    },
    // En cas d'erreur, restaure la liste et affiche une notification
    onError: (_err, _routineId, context) => {
      if (context?.previousRoutines) {
        queryClient.setQueryData(queryKey, context.previousRoutines);
      }
      toast.error("Impossible de supprimer la routine. Veuillez réessayer.");
    },
    // Resynchronise avec le serveur
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      queryClient.invalidateQueries({ queryKey: ["routine-statuses"] });
    },
  });

  return {
    routines,
    activeRoutines,
    archivedRoutines,
    statuses, // Statuts du jour pour chaque routine (complétée, sautée...)
    isLoading,
    addRoutine,
    toggleComplete, // Marque une routine comme complétée ou annule la complétion
    skipToday, // Marque une routine comme "sautée" pour aujourd'hui
    updateRoutine,
    deleteRoutine,
  };
};
