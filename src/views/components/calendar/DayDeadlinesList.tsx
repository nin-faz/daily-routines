import { taskStorage } from "@/data/repositories/tasks";
import { folderStorage } from "@/data/repositories/folders";
import type { Task } from "@/shared/types/task";
import type { Folder } from "@/shared/types/folder";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { CalendarClock, FolderKanban } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatDateYMD } from "@/shared/lib/date";
import { useEffect, useState } from "react";

interface DayDeadlinesListProps {
  date: Date;
}

const statusLabels: Record<string, string> = {
  todo: "À faire",
  doing: "En cours",
  done: "Terminé",
};

const statusVariants: Record<string, "default" | "secondary" | "outline"> = {
  todo: "outline",
  doing: "secondary",
  done: "default",
};

const DayDeadlinesList = ({ date }: DayDeadlinesListProps) => {
  const dateString = formatDateYMD(date);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const allTasks = await taskStorage.getTasks();
        const t = allTasks.filter((task) => task.deadline === dateString);
        const p = await folderStorage.getFolders();
        if (!mounted) return;
        setTasks(t);
        setFolders(p);
      } catch (err) {
        console.error("Error loading tasks for calendar:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dateString]);

  const getFolderTitle = (folderId?: string): string => {
    if (!folderId) return "Sans dossier";
    const folder = folders.find((f) => f.id === folderId);
    return folder?.name || "Dossier inconnu";
  };

  if (!tasks || tasks.length === 0) return null;

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          Deadlines du {format(date, "d MMMM", { locale: fr })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() =>
              navigate(task.folderId ? `/folder/${task.folderId}` : "/tasks")
            }
            className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg w-full text-left hover:shadow-md hover:bg-muted/60"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.title}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FolderKanban className="h-3 w-3" />
                <span className="ml-1 text-xs text-muted-foreground">
                  {getFolderTitle(task.folderId)}
                </span>
              </p>
            </div>

            <Badge variant={statusVariants[task.status]}>
              {statusLabels[task.status]}
            </Badge>
          </button>
        ))}
      </CardContent>
    </Card>
  );
};

export default DayDeadlinesList;
