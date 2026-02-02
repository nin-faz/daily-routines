import { useState } from "react";
import { ProjectTask, TaskStatus } from "@/types/project";
import { projectStorage } from "@/integrations/supabase/projects";
import KanbanColumn from "./KanbanColumn";
import EditTaskDialog from "./EditTaskDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  projectId: string;
  tasks: ProjectTask[];
  onTasksChange: () => void;
}

const KanbanBoard = ({ projectId, tasks, onTasksChange }: KanbanBoardProps) => {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState<Date | undefined>();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);

  const columns: { title: string; status: TaskStatus }[] = [
    { title: "À faire", status: "todo" },
    { title: "En cours", status: "doing" },
    { title: "Terminé", status: "done" },
  ];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTaskId) {
      projectStorage.updateTaskStatus(draggedTaskId, status);
      setDraggedTaskId(null);
      onTasksChange();
    }
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const task: ProjectTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      projectId,
      status: "todo",
      createdAt: new Date().toISOString(),
      deadline: newTaskDeadline
        ? format(newTaskDeadline, "yyyy-MM-dd")
        : undefined,
    };

    projectStorage.addTask(task);
    setNewTaskTitle("");
    setNewTaskDeadline(undefined);
    onTasksChange();
  };

  const handleDeleteTask = (taskId: string) => {
    projectStorage.deleteTask(taskId);
    onTasksChange();
  };

  const handleEditTask = (task: ProjectTask) => {
    setEditingTask(task);
  };

  const handleSaveTask = (id: string, updates: Partial<ProjectTask>) => {
    projectStorage.updateTask(id, updates);
    onTasksChange();
  };

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Nouvelle tâche..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
          className="flex-1 min-w-[150px] max-w-sm"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[100px] sm:w-[140px] justify-start text-left font-normal text-xs sm:text-sm",
                !newTaskDeadline && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {newTaskDeadline
                ? format(newTaskDeadline, "dd/MM/yy")
                : "Deadline"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={newTaskDeadline}
              onSelect={setNewTaskDeadline}
              locale={fr}
              initialFocus
              className="pointer-events-auto"
              disabled={{ before: new Date() }}
            />
          </PopoverContent>
        </Popover>
        <Button
          onClick={handleAddTask}
          size="icon"
          className="h-9 w-9 sm:h-10 sm:w-10"
          disabled={!newTaskTitle.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            title={column.title}
            status={column.status}
            tasks={getTasksByStatus(column.status)}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
          />
        ))}
      </div>

      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
