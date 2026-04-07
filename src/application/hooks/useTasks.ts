import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskStorage } from "@/data/repositories/tasks";
import { Task } from "@/shared/types/task";
import { useAuth } from "@/application/context/AuthContext";
import { buildTask } from "@/domain/builders";

export const useTasks = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  /**
  * Utiliser une clé de requête spécifique à l'utilisateur pour éviter les conflits entre les utilisateurs
  * qui se connectent sur le même appareil ou dans des onglets différents. 
  */
  const queryKey = ["tasks", user?.id];

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: queryKey,
    queryFn: () => taskStorage.getTasks(),
    // On ne lance la requête QUE si l'utilisateur est connu
    enabled: !!user?.id, 
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const addTask = useMutation({
    mutationFn: (taskData: Omit<Task, "id" | "createdAt" | "userId" | "updatedAt" | "status">) =>
      taskStorage.addTask(buildTask(taskData, user?.id || "")),
    onMutate: async (taskData: Omit<Task, "id" | "createdAt" | "userId" | "updatedAt" | "status">) => {
      await queryClient.cancelQueries({ queryKey: queryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
      queryClient.setQueryData<Task[]>(queryKey, (old = []) => [
        ...old,
        buildTask(taskData, user?.id || ""),
      ]);
      return { previousTasks };
    },
    onError: (_err, _taskData, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => taskStorage.updateTask(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
      queryClient.setQueryData<Task[]>(queryKey, (old = []) =>
        old.map(task => task.id === id ? { ...task, ...updates } : task)
      );
      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) => taskStorage.deleteTask(taskId),
    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
      queryClient.setQueryData<Task[]>(queryKey, (old = []) =>
        old.filter(task => task.id !== taskId)
      );
      return { previousTasks };
    },
    onError: (_err, _taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: queryKey });
  };

  return {
    tasks,
    isLoading: isLoadingTasks,
    addTask,
    updateTask,
    deleteTask,
    invalidateTasks,
  };
};
