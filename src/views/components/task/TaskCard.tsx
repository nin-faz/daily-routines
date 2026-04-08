import { Task, Status } from "@/shared/types/task";
import { Folder } from "@/shared/types/folder";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Calendar, Folder as FolderIcon, Pencil } from "lucide-react";
import ConfirmDeleteButton from "@/shared/components/ui/ConfirmDeleteButton";
import { format, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/shared/lib/utils";

interface TaskCardProps {
  task: Task;
  folder?: Folder;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showFolder?: boolean;
}

const TaskCard = ({
  task,
  folder,
  onToggleComplete,
  onEdit,
  onDelete,
  showFolder = true,
}: TaskCardProps) => {
  const deadlineDate = task.deadline
    ? new Date(task.deadline + "T00:00:00")
    : undefined;
  const isOverdue =
    deadlineDate && isPast(deadlineDate) && !isToday(deadlineDate);
  const isDueToday = deadlineDate && isToday(deadlineDate);

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-all",
        task.status === Status.DONE
          ? "bg-muted/50 border-border"
          : "bg-card border-border hover:border-primary/30",
      )}
    >
      <Checkbox
        checked={task.status === Status.DONE}
        onCheckedChange={onToggleComplete}
        className="mt-1"
        aria-label={`Marquer "${task.title}" comme terminée`}
      />

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium",
            task.status === Status.DONE && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </p>

        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {showFolder && folder && (
            <Badge variant="secondary" className="text-xs gap-1">
              <FolderIcon className="h-3 w-3" aria-hidden="true" />
              {folder.name}
            </Badge>
          )}

          {task.deadline && (
            <Badge
              variant={
                isOverdue && task.status !== Status.DONE
                  ? "destructive"
                  : isDueToday
                    ? "default"
                    : "outline"
              }
              className="text-xs gap-1"
            >
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {deadlineDate
                ? format(deadlineDate, "d MMM", { locale: fr })
                : ""}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onEdit}
          aria-label={`Modifier la tâche "${task.title}"`}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>
        <ConfirmDeleteButton
          onConfirm={onDelete}
          label="Supprimer la tâche ?"
          description={`Cette action supprimera définitivement "${task.title}".`}
          iconSize={3.5}
          buttonClassName="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive"
          actionLabel="Supprimer"
        />
      </div>
    </div>
  );
};

export default TaskCard;
