import { ProjectTask, TaskStatus } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, CalendarClock, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: ProjectTask[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: ProjectTask) => void;
}

const statusColors: Record<TaskStatus, string> = {
  todo: "border-t-foreground",
  doing: "border-t-primary",
  done: "border-t-success",
};

const KanbanColumn = ({
  title,
  status,
  tasks,
  onDragOver,
  onDrop,
  onDragStart,
  onDeleteTask,
  onEditTask,
}: KanbanColumnProps) => {
  return (
    <div
      className="flex-1 min-w-[240px] sm:min-w-[280px]"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
    >
      <Card className={cn("h-full border-t-4", statusColors[status])}>
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
          <CardTitle className="text-xs sm:text-sm font-medium flex items-center justify-between">
            {title}
            <span className="bg-muted text-muted-foreground px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs">
              {tasks.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 min-h-[150px] sm:min-h-[200px] p-3 sm:p-6 pt-0">
          {tasks.map((task) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => onDragStart(e, task.id)}
              className="bg-background border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm flex-1">{task.title}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onEditTask(task)}
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onDeleteTask(task.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
              {task.deadline && (
                <div
                  className={cn(
                    "flex items-center gap-1 mt-2 text-xs",
                    task.status === "done"
                      ? "text-success"
                      : isPast(parseISO(task.deadline)) &&
                          !isToday(parseISO(task.deadline))
                        ? "text-destructive font-semibold"
                        : isToday(parseISO(task.deadline))
                          ? "text-primary font-semibold"
                          : "text-foreground",
                  )}
                >
                  <CalendarClock className="h-3 w-3" />
                  <span>
                    {format(parseISO(task.deadline), "d MMM", { locale: fr })}
                  </span>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default KanbanColumn;
