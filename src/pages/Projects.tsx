import { useState, useEffect } from "react";
import { Project } from "@/types/project";
import Navigation from "@/components/layout/Navigation";
import CreateProjectDialog from "@/components/project/CreateProjectDialog";
import EditProjectDialog from "@/components/project/EditProjectDialog";
import KanbanBoard from "@/components/project/KanbanBoard";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Trash2, FolderKanban, Pencil, Lightbulb } from "lucide-react";
import { ProjectListSkeleton } from "@/components/project/ProjectSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import { useProjects } from "@/hooks/useProjects";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Projects = () => {
  const {
    projects,
    tasks,
    isLoading,
    addProject,
    updateProject,
    deleteProject,
    invalidateTasks,
  } = useProjects();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const handleCreateProject = (project: Project) => {
    addProject.mutate(project, {
      onSuccess: () => {
        setSelectedProjectId(project.id);
      },
    });
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProject.mutate(projectId, {
      onSuccess: () => {
        setSelectedProjectId(projects.length > 0 ? projects[0].id : null);
      },
    });
  };

  const handleUpdateProject = (id: string, updates: Partial<Project>) => {
    updateProject.mutate({ id, updates });
  };

  const handleTasksChange = () => {
    invalidateTasks();
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const projectTasks = tasks.filter((t) => t.projectId === selectedProjectId);

  return (
    <div className="min-h-screen bg-gradient-bg pb-20 md:pb-24">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-5xl">
        <header className="mb-6 sm:mb-8">
          <Header />
          <div className="flex items-center justify-center gap-2 mb-4">
            <FolderKanban className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Mes Projets
            </h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground text-center">
            Organisez vos tâches avec des tableaux Kanban
          </p>
        </header>

        <main className="space-y-4 sm:space-y-6">
          {isLoading ? (
            <ProjectListSkeleton />
          ) : projects.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="Aucun projet"
              description="Créez votre premier projet pour organiser vos tâches avec un tableau Kanban intuitif !"
            />
          ) : (
            <div className="space-y-6">
              {/* Projects Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => {
                  const projectTaskCount = tasks.filter(
                    (t) => t.projectId === project.id,
                  );
                  const todoCount = projectTaskCount.filter(
                    (t) => t.status === "todo",
                  ).length;
                  const doingCount = projectTaskCount.filter(
                    (t) => t.status === "doing",
                  ).length;
                  const doneCount = projectTaskCount.filter(
                    (t) => t.status === "done",
                  ).length;
                  const isSelected = project.id === selectedProjectId;

                  return (
                    <div
                      key={project.id}
                      onClick={() => setSelectedProjectId(project.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold truncate flex-1">
                          {project.title}
                        </h3>
                        {isSelected && (
                          <div className="flex gap-1 -mt-1 -mr-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProject(project);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent
                                onClick={(e) => e.stopPropagation()}
                              >
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Supprimer le projet ?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action supprimera définitivement le
                                    projet "{project.title}" et toutes ses
                                    tâches.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteProject(project.id)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {project.description}
                        </p>
                      )}
                      <div className="flex gap-3 text-xs">
                        <span className="text-foreground">
                          À faire: {todoCount}
                        </span>
                        <span className="text-primary">
                          En cours: {doingCount}
                        </span>
                        <span className="text-success">
                          Terminé: {doneCount}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Kanban Board for Selected Project */}
              {selectedProject && (
                <div className="pt-4 border-t border-border">
                  <h2 className="text-lg font-semibold mb-4">
                    {selectedProject.title}
                  </h2>
                  {selectedProject.description && (
                    <p className="text-muted-foreground mb-4">
                      {selectedProject.description}
                    </p>
                  )}
                  <KanbanBoard
                    projectId={selectedProjectId!}
                    tasks={projectTasks}
                    onTasksChange={handleTasksChange}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {editingProject && (
        <EditProjectDialog
          project={editingProject}
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
          onSave={handleUpdateProject}
        />
      )}

      <CreateProjectDialog onCreateProject={handleCreateProject} />

      <Navigation />
    </div>
  );
};

export default Projects;
