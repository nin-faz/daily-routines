import { projectStorage } from "@/integrations/supabase/projects";
import type { ProjectTask, Project } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, FolderKanban } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatDateYMD } from "@/lib/date";
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
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await projectStorage.getTasksWithDeadlineOnDate(dateString);
        const p = await projectStorage.getProjects();
        if (!mounted) return;
        setTasks(t);
        setProjects(p);
      } catch (err) {
        console.error("Error loading project tasks for calendar:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dateString]);

  const getProjectTitle = (projectId: string): string => {
    const project = projects.find((p) => p.id === projectId);
    return project?.title || "Projet inconnu";
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
          <div
            key={task.id}
            className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.title}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FolderKanban className="h-3 w-3" />
                {getProjectTitle(task.projectId)}
              </p>
            </div>

            <Badge variant={statusVariants[task.status]}>
              {statusLabels[task.status]}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DayDeadlinesList;
