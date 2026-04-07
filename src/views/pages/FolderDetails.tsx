import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTasks } from "@/application/hooks/useTasks";
import TaskListSkeleton from "@/views/components/task/TaskSkeleton";
import TaskCard from "@/views/components/task/TaskCard";
import { Button } from "@/shared/components/ui/button";
import {
  ArrowLeft,
  Plus,
  ListTodo,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import CreateTaskDialog from "@/views/components/task/CreateTaskDialog";
import EmptyState from "@/shared/components/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { Status, Task } from "@/shared/types/task";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useFolders } from "@/application/hooks/useFolders";

const FolderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, isLoading, updateTask, deleteTask, addTask } = useTasks();
  const { folders } = useFolders();

  const folder = folders.find((f) => f.id === id);
  const folderTasks = tasks
    .filter((t) => t.folderId === id)
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );

  const selectedFolderId = id;

  const getFolderById = (folderId?: string) =>
    folders.find((f) => f.id === folderId);

  const [editingTask, setEditingTask] = useState<any>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("todo");

  const handleCreateTask = (
    taskData: Omit<
      Task,
      "id" | "createdAt" | "userId" | "updatedAt" | "status"
    >,
  ) => {
    addTask.mutate(taskData);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditDialogOpen(true);
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    updateTask.mutate(
      { id, updates },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setEditingTask(undefined);
        },
      },
    );
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask.mutate(taskId);
  };

  const handleToggleTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask.mutate({
      id: taskId,
      updates: {
        status: task.status === Status.TODO ? Status.DONE : Status.TODO,
      },
    });
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-start gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Retour à l'accueil"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Mes tâches
          </h1>
        </div>
      </div>

      <hr className="border-border w-full mb-6" />

      <h1 className="text-3xl font-bold text-foreground mb-2">
        {folder?.name}
      </h1>
      <p className="text-muted-foreground mt-1 mb-6">
        Créée le{" "}
        {format(parseISO(folder?.createdAt || ""), "dd MMMM yyyy", {
          locale: fr,
        })}
      </p>

      <div className="space-y-4">
        {isLoading ? (
          <TaskListSkeleton />
        ) : (
          <div className="flex items-center justify-between">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="flex items-center justify-between gap-2">
                <TabsList>
                  <TabsTrigger value="todo" className="gap-1.5">
                    <ListTodo className="h-4 w-4" />À faire
                  </TabsTrigger>
                  <TabsTrigger value="done" className="gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Terminées
                  </TabsTrigger>
                </TabsList>
                <CreateTaskDialog
                  folders={folders}
                  defaultFolderId={selectedFolderId}
                  onCreateTask={handleCreateTask}
                  trigger={
                    <Button size="sm" className="gap-1.5">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Ajouter</span>
                    </Button>
                  }
                />
              </div>

              <TabsContent value="todo" className="mt-4 space-y-2">
                {folderTasks.filter((t) => t.status === Status.TODO).length ===
                0 ? (
                  <EmptyState
                    icon={ListTodo}
                    title="Aucune tâche"
                    description="Ajoutez votre première tâche dans ce dossier"
                  />
                ) : (
                  folderTasks
                    .filter((t) => t.status === Status.TODO)
                    .map((task: Task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        folder={getFolderById(task.folderId)}
                        onToggleComplete={() => handleToggleTask(task.id)}
                        onEdit={() => {
                          handleEditTask(task);
                        }}
                        onDelete={() => handleDeleteTask(task.id)}
                        showFolder={false}
                      />
                    ))
                )}
              </TabsContent>

              <TabsContent value="done" className="mt-4 space-y-2">
                {folderTasks.filter((t) => t.status === Status.DONE).length ===
                0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="Aucune tâche terminée"
                    description="Les tâches complétées apparaîtront ici"
                  />
                ) : (
                  folderTasks
                    .filter((t) => t.status === Status.DONE)
                    .map((task: Task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        folder={getFolderById(task.folderId)}
                        onToggleComplete={() => handleToggleTask(task.id)}
                        onEdit={() => handleEditTask(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                        showFolder={false}
                      />
                    ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
      {/* Edit task dialog */}
      {editingTask && (
        <CreateTaskDialog
          folders={folders}
          task={editingTask}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdateTask={handleUpdateTask}
        />
      )}
    </div>
  );
};

export default FolderDetails;
