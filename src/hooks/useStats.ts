import { useQuery } from "@tanstack/react-query";
import { routineStorage } from "@/integrations/supabase/routines";
import { projectStorage } from "@/integrations/supabase/projects";

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

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectStorage.getProjects(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => projectStorage.getTasks(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  return {
    routines,
    statuses,
    projects,
    tasks,
    isLoading: isLoadingRoutines || isLoadingStatuses || isLoadingProjects || isLoadingTasks,
  };
};
