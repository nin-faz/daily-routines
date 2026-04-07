import { useQuery } from "@tanstack/react-query";
import { routineStorage } from "@/data/repositories/routines";
import { folderStorage } from "@/data/repositories/folders";
import { taskStorage } from "@/data/repositories/tasks";

export const useStats = () => {
  const { data: routines = [], isLoading: isLoadingRoutines } = useQuery({
    queryKey: ["routines"],
    queryFn: () => routineStorage.getRoutines(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,
  });

  const { data: statuses = [], isLoading: isLoadingStatuses } = useQuery({
    queryKey: ["routine-statuses"],
    queryFn: () => routineStorage.getStatuses(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const { data: folders = [], isLoading: isLoadingFolders } = useQuery({
    queryKey: ["folders"],
    queryFn: () => folderStorage.getFolders(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => taskStorage.getTasks(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  return {
    routines,
    statuses,
    folders,
    tasks,
    isLoading:
      isLoadingRoutines || isLoadingStatuses || isLoadingFolders || isLoadingTasks,
  };
};
