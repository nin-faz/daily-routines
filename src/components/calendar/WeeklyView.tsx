import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format, addWeeks, subWeeks, isSameDay, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getWeekDays } from "@/lib/date";
import { routineStorage } from "@/integrations/supabase/routines";
import { taskStorage } from "@/integrations/supabase/tasks";

interface WeeklyViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function WeeklyView({ selectedDate, onDateSelect }: WeeklyViewProps) {
  const [currentWeek, setCurrentWeek] = useState(selectedDate);

  const weekDays = getWeekDays(currentWeek, { locale: fr });
  const weekStart = weekDays[0];
  const weekEnd = weekDays[weekDays.length - 1];

  // Charger les données pour toute la semaine en une seule fois
  const {
    data: weekData = { completionRates: {}, deadlines: new Set<string>() },
    isLoading,
  } = useQuery({
    queryKey: ["week-data", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const startDate = format(weekStart, "yyyy-MM-dd");
      const endDate = format(weekEnd, "yyyy-MM-dd");

      const completionRates = await routineStorage.getCompletionRatesForWeek(
        startDate,
        endDate,
      );

      const tasks = await taskStorage.getTasks();
      const deadlines = new Set<string>();
      tasks.forEach((t) => {
        if (!t.deadline) return;
        if (t.deadline >= startDate && t.deadline <= endDate) {
          deadlines.add(t.deadline);
        }
      });

      return { completionRates, deadlines };
    },
    staleTime: 5 * 60 * 1000,
  });

  const handlePreviousWeek = () => {
    setCurrentWeek((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek((prev) => addWeeks(prev, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentWeek(today);
    onDateSelect(today);
  };

  const getCompletionColor = (rate: number) => {
    if (rate === 0) return "bg-muted text-muted-foreground";
    if (rate < 50)
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    if (rate < 100)
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  };

  const weekStats = {
    perfectDays: Object.values(weekData.completionRates).filter(
      (rate) => rate === 100,
    ).length,
    totalDeadlines: weekData.deadlines.size,
    averageCompletion:
      Object.values(weekData.completionRates).length > 0
        ? Math.round(
            Object.values(weekData.completionRates).reduce(
              (sum: number, rate: number) => sum + rate,
              0,
            ) / Object.values(weekData.completionRates).length,
          )
        : 0,
  };

  return (
    <div className="space-y-4">
      {/* En-tête de navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center justify-center w-full sm:justify-start gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm sm:text-lg font-semibold">
            Semaine du {format(weekStart, "d MMM", { locale: fr })} au{" "}
            {format(weekEnd, "d MMM yyyy", { locale: fr })}
          </h3>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={handleToday}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          Aujourd'hui
        </Button>
      </div>

      {/* Statistiques de la semaine et légende */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Badges de statistiques */}
        <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-4 text-xs sm:text-sm">
          <Badge
            variant="outline"
            className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 justify-center"
          >
            {weekStats.perfectDays} jour{weekStats.perfectDays !== 1 ? "s" : ""}{" "}
            à 100%
          </Badge>
          <Badge variant="outline" className="justify-center">
            Moy. : {weekStats.averageCompletion}%
          </Badge>
          <Badge variant="outline" className="justify-center">
            {weekStats.totalDeadlines} deadline
            {weekStats.totalDeadlines !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Légende - cachée sur mobile, visible sur desktop */}
        <div className="hidden sm:flex items-center gap-3 text-xs bg-muted/30 p-2 rounded-lg">
          <span className="font-medium">Taux de réussite :</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-muted border flex-shrink-0" />
            <span>0%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-orange-100 dark:bg-orange-900/30 flex-shrink-0" />
            <span>&lt;50%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-yellow-100 dark:bg-yellow-900/30 flex-shrink-0" />
            <span>&lt;100%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900/30 flex-shrink-0" />
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Légende mobile uniquement */}
      <div className="sm:hidden bg-muted/30 p-3 rounded-lg">
        <div className="flex flex-col gap-2 text-xs">
          <span className="font-medium">Taux de réussite :</span>
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-sm bg-muted border flex-shrink-0" />
              <span>0%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-sm bg-orange-100 dark:bg-orange-900/30 flex-shrink-0" />
              <span>&lt;50%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-sm bg-yellow-100 dark:bg-yellow-900/30 flex-shrink-0" />
              <span>&lt;100%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-sm bg-green-100 dark:bg-green-900/30 flex-shrink-0" />
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grille des jours */}
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-7 gap-4 transition-opacity duration-200",
          isLoading && "opacity-40",
        )}
      >
        {weekDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const completionRate = weekData.completionRates[dateStr] || 0;
          const hasDeadline = weekData.deadlines.has(dateStr);
          const isSelected = isSameDay(day, selectedDate);
          const isDayToday = isToday(day);

          return (
            <Card
              key={dateStr}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected && "ring-2 ring-primary",
                isDayToday && "border-primary",
              )}
              onClick={() => onDateSelect(day)}
            >
              <CardContent className="p-4 space-y-3">
                {/* En-tête du jour */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase">
                      {format(day, "EEE", { locale: fr })}
                    </div>
                    <div
                      className={cn(
                        "text-2xl font-bold",
                        isDayToday && "text-primary",
                      )}
                    >
                      {format(day, "d")}
                    </div>
                  </div>
                  {isDayToday && (
                    <Badge variant="default" className="z-50 text-xs">
                      Aujourd'hui
                    </Badge>
                  )}
                </div>

                {/* Taux de réussite */}
                <div className="space-y-2">
                  <div className="text-xs">
                    <span className="text-muted-foreground">
                      Routines&nbsp;
                      <span className="font-medium">{completionRate}%</span>
                    </span>
                  </div>
                  <div
                    className={cn(
                      "h-2 rounded-full",
                      getCompletionColor(completionRate),
                    )}
                  >
                    <div
                      className="h-full rounded-full bg-current opacity-50"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Indicateur de deadline */}
                {hasDeadline && (
                  <Badge
                    variant="outline"
                    className="text-xs px-8 py-2 w-full justify-center bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  >
                    📌 <span>Deadline</span>
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
