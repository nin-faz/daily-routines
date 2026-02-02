import { Routine, RoutineStatus } from "@/types/routine";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { getRoutineCompletionRate, cn, getRoutinesAtDate } from "@/lib/utils";
import { formatDateYMD } from "@/lib/date";

interface DayRoutinesListProps {
  routines: Routine[];
  statuses: RoutineStatus[];
  date: Date;
}

const DayRoutinesList = ({
  routines,
  statuses,
  date,
}: DayRoutinesListProps) => {
  /**
   *  Formate la date pour avoir par ex "lundi 1 janvier 2024"
   */
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  /**
   * Retourne le statut (RoutineStatus) associé à une routine pour la date affichée,
   * ou undefined si la routine n’a pas de statut ce jour-là.
   */
  const getStatusForRoutine = (
    routineId: string,
  ): RoutineStatus | undefined => {
    return statuses.find(
      (s) => s.routineId === routineId && s.date === formatDateYMD(date),
    );
  };

  /**
   * Condition selon le statut de la routine, elle renvoie quelle pourcentage
   * On ne garde que les routines créées à la date du jour affiché ou avant
   */

  const routinesAtDate = getRoutinesAtDate(routines, formatDateYMD(date));
  const {
    completedCount,
    total,
    rate: completionRate,
  } = getRoutineCompletionRate(routinesAtDate, statuses);
  const completionRatePercent = total > 1 ? completionRate : 0;

  return (
    <Card className="p-4 shadow-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold capitalize">
            {formatDate(date)}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {completedCount} / {total}
            </span>

            <span
              className={cn(
                "text-sm font-semibold",
                completionRatePercent === 100
                  ? "text-green-600"
                  : completionRatePercent >= 50
                    ? "text-yellow-600"
                    : completionRatePercent > 0
                      ? "text-orange-600"
                      : "text-destructive",
              )}
            >
              {completionRatePercent}%
            </span>
          </div>
        </div>

        {(() => {
          /**
           * On ne garde que les routines créées à la date du jour affiché ou avant
           * Pour éviter que les routines crées apparaissent sur les jours précédents
           */
          const filteredRoutines = getRoutinesAtDate(
            routines,
            formatDateYMD(date),
          );
          if (filteredRoutines.length === 0) {
            return (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune routine créée
              </p>
            );
          } else {
            return (
              <div className="space-y-2">
                {filteredRoutines.map((routine) => {
                  const status = getStatusForRoutine(routine.id);
                  const isCompleted = status?.completed || false;
                  const isSkipped = status?.skipped || false;

                  return (
                    <div
                      key={routine.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        isCompleted ? "bg-muted/50" : "bg-background",
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      ) : isSkipped ? (
                        <Circle className="h-5 w-5 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <h4
                          className={cn(
                            "text-sm font-medium",
                            isCompleted && "line-through text-muted-foreground",
                            isSkipped && "text-sm",
                          )}
                        >
                          {routine.title}
                        </h4>
                        {isSkipped && (
                          <span className="text-xs text-primary">
                            Routine sautée
                          </span>
                        )}
                        {routine.duration && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{routine.duration} min</span>
                          </div>
                        )}
                      </div>

                      {status?.completedAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(status.completedAt).toLocaleTimeString(
                            "fr-FR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          }
        })()}
      </div>
    </Card>
  );
};

export default DayRoutinesList;
