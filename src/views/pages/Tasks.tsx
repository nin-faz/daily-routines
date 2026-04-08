import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Status, Task } from "@/shared/types/task";
import { Folder } from "@/shared/types/folder";
import Navigation from "@/application/components/layout/Navigation";
import CreateTaskDialog from "@/views/components/task/CreateTaskDialog";
import TaskCard from "@/views/components/task/TaskCard";
import CreateFolderDialog from "@/views/components/folder/CreateFolderDialog";
import FolderCard from "@/views/components/folder/FolderCard";
import EmptyState from "@/shared/components/EmptyState";
import Header from "@/application/components/layout/Header";
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { usePageTitle } from "@/application/hooks/usePageTitle";
// import { FolderListSkeleton } from "@/views/components/tasks/FolderListSkeleton";
import {
  ClipboardList,
  ListTodo,
  CheckCircle2,
  Inbox,
  ArrowLeft,
  Plus,
} from "lucide-react";
import TaskListSkeleton from "@/views/components/task/TaskSkeleton";
import { useTasks } from "@/application/hooks/useTasks";
import { useFolders } from "@/application/hooks/useFolders";

const Tasks = () => {
  usePageTitle("Mes Tâches");
  const { tasks, isLoading, addTask, updateTask, deleteTask } = useTasks();

  const { folders, addFolder, updateFolder, deleteFolder } = useFolders();

  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [editingFolder, setEditingFolder] = useState<Folder | undefined>(
    undefined,
  );
  const [editFolderDialogOpen, setEditFolderDialogOpen] = useState(false);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("todo");

  const selectedFolder = folders.find((f: Folder) => f.id === selectedFolderId);

  const getTasksForView = () => {
    let filteredTasks = selectedFolderId
      ? tasks.filter((t: Task) => t.folderId === selectedFolderId)
      : tasks;
    if (activeTab === "todo") {
      return filteredTasks.filter((t: Task) => t.status === Status.TODO);
    } else {
      return filteredTasks.filter((t: Task) => t.status === Status.DONE);
    }
  };

  const tasksToShow = getTasksForView();
  const unfiledTasks = tasks.filter((t: Task) => !t.folderId);
  const unfiledIncomplete = unfiledTasks.filter(
    (t: Task) => t.status === Status.TODO,
  ).length;

  const getFolderById = (folderId?: string) =>
    folders.find((f: Folder) => f.id === folderId);

  /** Opérations TASK */

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

  /** Opérations FOLDER */

  const handleCreateFolder = (
    folderData: Omit<Folder, "id" | "createdAt" | "userId" | "updatedAt">,
  ) => {
    addFolder.mutate(folderData);
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setEditFolderDialogOpen(true);
  };

  const handleUpdateFolder = (id: string, updates: Partial<Folder>) => {
    updateFolder.mutate(
      { id, updates },
      {
        onSuccess: () => {
          setEditFolderDialogOpen(false);
          setEditingFolder(undefined);
        },
      },
    );
  };

  const handleDeleteFolder = (folderId: string) => {
    deleteFolder.mutate(folderId);
  };

  return (
    <div className="min-h-screen bg-gradient-bg pb-20">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-3xl">
        <Header />

        <div className="flex items-center justify-center gap-2 mb-4">
          <ClipboardList className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Mes Tâches
          </h1>
        </div>
        <main className="space-y-6">
          {isLoading ? (
            <TaskListSkeleton />
          ) : (
            <>
              {selectedFolderId ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedFolderId(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h2 className="text-lg sm:text-xl font-bold truncate">
                      {selectedFolder?.name}
                    </h2>
                  </div>
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
                      {tasksToShow.length === 0 ? (
                        <EmptyState
                          icon={ListTodo}
                          title="Aucune tâche"
                          description="Ajoutez votre première tâche dans ce dossier"
                        />
                      ) : (
                        tasksToShow.map((task: Task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            folder={getFolderById(task.folderId)}
                            onToggleComplete={() =>
                              updateTask.mutate({
                                id: task.id,
                                updates: {
                                  status:
                                    task.status === Status.TODO
                                      ? Status.DONE
                                      : Status.TODO,
                                },
                              })
                            }
                            onEdit={() => handleEditTask(task)}
                            onDelete={() => handleDeleteTask(task.id)}
                            showFolder={false}
                          />
                        ))
                      )}
                    </TabsContent>
                    <TabsContent value="done" className="mt-4 space-y-2">
                      {tasksToShow.length === 0 ? (
                        <EmptyState
                          icon={CheckCircle2}
                          title="Aucune tâche terminée"
                          description="Les tâches complétées apparaîtront ici"
                        />
                      ) : (
                        tasksToShow.map((task: Task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            folder={getFolderById(task.folderId)}
                            onToggleComplete={() =>
                              updateTask.mutate({
                                id: task.id,
                                updates: {
                                  status:
                                    task.status === Status.TODO
                                      ? Status.DONE
                                      : Status.TODO,
                                },
                              })
                            }
                            onEdit={() => handleEditTask(task)}
                            onDelete={() => handleDeleteTask(task.id)}
                            showFolder={false}
                          />
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CreateFolderDialog onCreateFolder={handleCreateFolder} />
                    <CreateTaskDialog
                      folders={folders}
                      onCreateTask={handleCreateTask}
                    />
                  </div>
                  {folders.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-sm font-medium text-muted-foreground">
                        Dossiers
                      </h2>
                      <div className="grid gap-2">
                        {[...folders]
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt || 0).getTime() -
                              new Date(a.createdAt || 0).getTime(),
                          )
                          .map((folder: Folder) => {
                            const folderTasks = tasks.filter(
                              (t: Task) => t.folderId === folder.id,
                            );
                            const completedCount = folderTasks.filter(
                              (t: Task) => t.status === Status.DONE,
                            ).length;
                            return (
                              <FolderCard
                                key={folder.id}
                                folder={folder}
                                taskCount={folderTasks.length}
                                completedCount={completedCount}
                                isSelected={false}
                                onClick={() => navigate(`/folder/${folder.id}`)}
                                onEdit={() => handleEditFolder(folder)}
                                onDelete={() => handleDeleteFolder(folder.id)}
                              />
                            );
                          })}
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Inbox className="h-4 w-4" />
                        Inbox ({unfiledIncomplete} à faire)
                      </h2>
                    </div>
                    {unfiledTasks.length === 0 && folders.length === 0 ? (
                      <EmptyState
                        icon={ClipboardList}
                        title="Aucune tâche"
                        description="Créez un dossier ou ajoutez directement une tâche pour commencer"
                      />
                    ) : unfiledTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune tâche sans dossier
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {unfiledTasks
                          .filter((t: Task) => t.status === Status.TODO)
                          .map((task: Task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onToggleComplete={() =>
                                updateTask.mutate({
                                  id: task.id,
                                  updates: { status: Status.DONE },
                                })
                              }
                              onEdit={() => handleEditTask(task)}
                              onDelete={() => handleDeleteTask(task.id)}
                              showFolder={false}
                            />
                          ))}
                        {unfiledTasks.some(
                          (t: Task) => t.status === Status.DONE,
                        ) && (
                          <details className="mt-4">
                            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                              Tâches terminées (
                              {
                                unfiledTasks.filter(
                                  (t: Task) => t.status === Status.DONE,
                                ).length
                              }
                              )
                            </summary>
                            <div className="space-y-2 mt-2">
                              {unfiledTasks
                                .filter((t: Task) => t.status === Status.DONE)
                                .map((task: Task) => (
                                  <TaskCard
                                    key={task.id}
                                    task={task}
                                    onToggleComplete={() =>
                                      updateTask.mutate({
                                        id: task.id,
                                        updates: { status: Status.TODO },
                                      })
                                    }
                                    onEdit={() => handleEditTask(task)}
                                    onDelete={() => handleDeleteTask(task.id)}
                                    showFolder={false}
                                  />
                                ))}
                            </div>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
        {/* Dialog d'édition de tâche */}
        {editingTask && (
          <CreateTaskDialog
            folders={folders}
            task={editingTask}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onUpdateTask={handleUpdateTask}
          />
        )}
        {/* Dialog d'édition de dossier */}
        {editingFolder && (
          <CreateFolderDialog
            folder={editingFolder}
            open={editFolderDialogOpen}
            onOpenChange={setEditFolderDialogOpen}
            onCreateFolder={handleCreateFolder}
            onUpdateFolder={handleUpdateFolder}
          />
        )}
        <Navigation />
      </div>
    </div>
  );
};

export default Tasks;
