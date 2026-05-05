import { Routine, RoutineStatus } from "@/shared/types/routine";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Calendar, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import {
  getRoutineCompletionRate,
  getRoutinesAtDate,
} from "@/domain/routineRules";
import { formatDateYMD } from "@/shared/lib/date";
import { getFrequencyLabel, getTimeOfDayLabel, getDayLabel } from "@/shared/lib/days";

interface DayRoutinesListProps {
  routines: Routine[];
  statuses: RoutineStatus[];
  date: Date;
  isLoading?: boolean;
}

const DayRoutinesList = ({
  routines,
  statuses,
  date,
  isLoading = false,
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

  // Breakdown par type
  const quotidiennes = routinesAtDate.filter(
    (r) => !r.frequency || r.frequency === "daily",
  ).length;
  const hebdos = routinesAtDate.filter((r) => r.frequency === "weekly").length;

  return (
    <Card className="p-4 shadow-card">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold capitalize">
            {formatDate(date)}
          </h3>
          <div className={`flex items-center gap-2 transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"}`}>
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

        {/* Breakdown par type - Plus discret et moderne */}
        {total > 0 && (
          <div className="flex gap-3 mb-4 px-1">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {quotidiennes} Quotidienne{quotidiennes > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {hebdos} Hebdo{hebdos > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}

        {(() => {
          const filteredRoutines = getRoutinesAtDate(
            routines,
            formatDateYMD(date),
          );

          if (filteredRoutines.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center py-10 opacity-60">
                <div className="p-3 rounded-full bg-muted mb-2">
                  <Circle className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Aucune routine pour ce jour
                </p>
              </div>
            );
          }

          return (
            <div className="grid gap-2.5">
              {filteredRoutines.filter(Boolean).map((routine) => {
                const status = getStatusForRoutine(routine.id);
                const isCompleted = status?.completed || false;
                const isSkipped = status?.skipped || false;

                // On récupère les composants d'icônes pour le moment de la journée
                const timeInfo = routine.timeOfDay
                  ? getTimeOfDayLabel(routine.timeOfDay)
                  : null;

                return (
                  <div
                    key={routine.id}
                    className={cn(
                      "group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-200",
                      "border border-transparent hover:shadow-card-hover transition-all duration-200",

                      isCompleted || isSkipped
                        ? "bg-muted/30 opacity-60"
                        : "bg-card shadow-sm border-border/50 hover:shadow-md",
                    )}
                  >
                    {/* Checkbox Custom */}
                    <div className="relative flex items-center justify-center">
                      {isCompleted ? (
                        <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                      ) : (
                        <Circle
                          className={cn(
                            "h-5 w-5 transition-colors",
                            isSkipped
                              ? "text-muted-foreground/40"
                              : "text-muted-foreground/40 group-hover:text-primary",
                          )}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4
                        className={cn(
                          "text-sm font-semibold transition-all",
                          isCompleted
                            ? "text-muted-foreground line-through"
                            : "text-foreground",
                        )}
                      >
                        {routine.title}{" "}
                        <Badge
                          variant="outline"
                          className={
                            routine.frequency === "weekly"
                              ? "text-xs ml-2 py-0 h-5 bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 font-bold tracking-tight"
                              : "text-xs ml-2 py-0 h-5 border-primary/30 text-primary uppercase font-bold tracking-tight"
                          }
                        >
                          {getFrequencyLabel(routine.frequency)}
                        </Badge>
                      </h4>

                      <div className="flex items-center gap-2 mt-1.5">
                        {/* Badge Moment avec Icône */}
                        {timeInfo && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium bg-muted/50 px-1.5 py-0.5 rounded border border-border/40">
                            {/* {TimeIcon && <TimeIcon className="h-3 w-3" />} */}
                            {timeInfo.label}
                          </div>
                        )}

                        {routine.frequency === "weekly" && routine.weekDays && (
                          <div className="flex gap-0.5">
                            {routine.weekDays.map((d) => (
                              <Badge
                                key={d}
                                variant="outline"
                                className="text-xs gap-1 py-0 h-5 border-primary/30 text-primary"
                              >
                                <Calendar className="h-3 w-3" />
                                {getDayLabel(d)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Indicateur de statut discret à droite */}
                    {isSkipped && (
                      <Badge variant="secondary" className="text-xs py-0 h-5">
                        Jour de repos
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </Card>
  );
};

export default DayRoutinesList;
