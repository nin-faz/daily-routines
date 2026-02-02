import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectStorage } from "@/integrations/supabase/projects";
import { Project, ProjectTask } from "@/types/project";

export const useProjects = () => {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectStorage.getProjects(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10,
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => projectStorage.getTasks(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const addProject = useMutation({
    mutationFn: (project: Project) => {
      projectStorage.addProject(project);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      projectStorage.updateProject(id, updates);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: (projectId: string) => {
      projectStorage.deleteProject(projectId);
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  return {
    projects,
    tasks,
    isLoading: isLoadingProjects || isLoadingTasks,
    addProject,
    updateProject,
    deleteProject,
    invalidateTasks,
  };
};
