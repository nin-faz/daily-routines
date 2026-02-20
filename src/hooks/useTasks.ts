import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskStorage } from "@/integrations/supabase/tasks";
import { Status, Task } from "@/types/task";


export const useTasks = () => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => taskStorage.getTasks(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const addTask = useMutation({
    mutationFn: (taskData: Omit<Task, "id" | "createdAt" | "userId" | "updatedAt" | "status">) => {
      const newTask: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        userId: "", // Sera remplacé par le trigger de la base de données
        status: Status.TODO,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return taskStorage.addTask(newTask);
    },
    onMutate: async (taskData: Omit<Task, "id" | "createdAt" | "userId" | "updatedAt" | "status">) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
      const newTask: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        userId: "", // Sera remplacé par le trigger de la base de données
        status: Status.TODO,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<Task[]>(["tasks"], (old = []) => [...old, newTask]);
      return { previousTasks };
    },
    onError: (_err, _taskData, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => taskStorage.updateTask(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
      queryClient.setQueryData<Task[]>(["tasks"], (old = []) =>
        old.map(task => task.id === id ? { ...task, ...updates } : task)
      );
      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: (taskId: string) => taskStorage.deleteTask(taskId),
    onMutate: async (taskId: string) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
      queryClient.setQueryData<Task[]>(["tasks"], (old = []) =>
        old.filter(task => task.id !== taskId)
      );
      return { previousTasks };
    },
    onError: (_err, _taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
