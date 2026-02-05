import { Routine, RoutineStatus } from "@/types/routine";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Clock, TrendingUp, CalendarX, Pencil } from "lucide-react";
import Timer from "./Timer";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface RoutineCardProps {
  routine: Routine;
  status?: RoutineStatus;
  onToggleComplete: () => void;
  onSkipToday: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const RoutineCard = ({
  routine,
  status,
  onToggleComplete,
  onSkipToday,
  onEdit,
  onDelete,
}: RoutineCardProps) => {
  const isCompleted = status?.completed || false;
  const isSkipped = status?.skipped || false;
  const navigate = useNavigate();

  return (
    <Card
      className={cn(
        "p-3 sm:p-4 shadow-card hover:shadow-card-hover transition-all duration-200",
        isCompleted && "opacity-60",
        isSkipped && "opacity-50 border-muted",
      )}
    >
      <div className="flex flex-col gap-2">
        {/* Première ligne: checkbox, titre, boutons d'action */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={onToggleComplete}
              disabled={isSkipped}
              className="flex-shrink-0"
            />

            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => navigate(`/routine/${routine.id}`)}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={cn(
                    "text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors",
                    isSkipped && "text-muted-foreground",
                  )}
                >
                  {routine.title}
                </h3>
                {isSkipped && (
                  <Badge variant="secondary" className="text-xs py-0 h-5">
                    Sautée aujourd'hui
                  </Badge>
                )}
              </div>
              {routine.duration && (
                <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                  <Clock className="h-3 w-3" />
                  <span>{routine.duration} min</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/routine/${routine.id}`)}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onSkipToday}
              disabled={isCompleted}
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 p-0",
                isSkipped && "text-primary bg-primary/10",
              )}
              title={
                isSkipped
                  ? "Annuler le saut - Marquer comme à faire"
                  : "Sauter aujourd'hui - Ne pas faire cette routine aujourd'hui"
              }
            >
              <CalendarX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>

            {/* Timer visible uniquement sur desktop */}
            {routine.hasTimer && routine.duration && !isSkipped && (
              <div className="hidden sm:block">
                <Timer duration={routine.duration} routineId={routine.id} />
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              title="Modifier"
            >
              <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        {/* Deuxième ligne: Timer (uniquement sur mobile et si timer activé) */}
        {routine.hasTimer && routine.duration && !isSkipped && (
          <div className="flex items-center justify-end pl-7 sm:hidden">
            <Timer duration={routine.duration} routineId={routine.id} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default RoutineCard;
