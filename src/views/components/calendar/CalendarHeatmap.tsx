import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/shared/components/ui/calendar";
import { Card } from "@/shared/components/ui/card";
import { routineStorage } from "@/data/repositories/routines";
import { taskStorage } from "@/data/repositories/tasks";
import { cn } from "@/shared/lib/utils";
import { formatDateYMD } from "@/shared/lib/date";

import { fr } from "date-fns/locale";

interface CalendarHeatmapProps {
  onDateSelect?: (date: Date) => void;
}

const CalendarHeatmap = ({ onDateSelect }: CalendarHeatmapProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateSelect?.(date);
    }
  };

  // Fetch completion rates with React Query cache
  const { data: completionRates = {}, isLoading: isLoadingRates } = useQuery({
    queryKey: [
      "completion-rates",
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
    ],
    queryFn: () =>
      routineStorage.getCompletionRatesForMonth(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
      ),
    staleTime: 5 * 60 * 1000, // Cache pendant 5 minutes
  });

  // Fetch deadlines with React Query cache
  const {
    data: deadlineDates = new Set<string>(),
    isLoading: isLoadingDeadlines,
  } = useQuery({
    queryKey: [
      "deadlines-month",
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
    ],
    queryFn: async () => {
      const tasks = await taskStorage.getTasks();
      const set = new Set<string>();
      tasks.forEach((t) => {
        if (!t.deadline) return;
        const d = new Date(t.deadline + "T00:00:00");
        if (
          d.getFullYear() === currentMonth.getFullYear() &&
          d.getMonth() === currentMonth.getMonth()
        ) {
          set.add(t.deadline);
        }
      });
      return set;
    },
    staleTime: 5 * 60 * 1000, // Cache pendant 5 minutes
  });

  const isLoading = isLoadingRates || isLoadingDeadlines;

  // Calculer la série actuelle (streak)
  const calculateStreak = () => {
    const today = new Date();
    let streak = 0;
    // Si aujourd'hui est complété, on commence à aujourd'hui, sinon à hier
    let currentDate = new Date(today);
    const todayStr = formatDateYMD(currentDate);
    if (completionRates[todayStr] !== 100) {
      // On commence à hier
      currentDate.setDate(currentDate.getDate() - 1);
    }
    while (true) {
      const dateStr = formatDateYMD(currentDate);
      if (completionRates[dateStr] === 100) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (completionRates[dateStr] === -1) {
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const todayStr = formatDateYMD(new Date());
  const todayRate = completionRates[todayStr] ?? 0;
  const todayComplete = todayRate === 100;
  const currentStreak = calculateStreak();

  // Calculer les statistiques du mois
  const monthStats = {
    perfectDays: Object.values(completionRates).filter((rate) => rate === 100)
      .length,
    monthName: currentMonth.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    }),
    totalDays: Object.keys(completionRates).length,
    averageRate:
      Object.keys(completionRates).length > 0
        ? Math.round(
            Object.values(completionRates).reduce(
              (sum, rate) => sum + rate,
              0,
            ) / Object.keys(completionRates).length,
          )
        : 0,
  };

  // Messages de motivation façon Duolingo - personnalisés et émotionnels
  const getMotivationMessage = () => {
    // Aujourd'hui n'est pas terminé
    if (!todayComplete && currentStreak > 0) {
      if (currentStreak >= 7) {
        return `🔥 Attention ! Votre série de ${currentStreak} jours est en danger ! Ne la laissez pas s'éteindre !`;
      }
      if (currentStreak >= 3) {
        return `⚠️ Vous avez une série de ${currentStreak} jours ! Terminez aujourd'hui pour la conserver !`;
      }
      return "💪 Terminez vos routines pour commencer une série !";
    }

    // Aujourd'hui est terminé
    if (todayComplete) {
      if (currentStreak >= 30) {
        return `🌟 INCROYABLE ! ${currentStreak} jours d'affilée ! Vous êtes une légende !`;
      }
      if (currentStreak >= 14) {
        return `🔥 ${currentStreak} jours de suite ! Vous êtes en feu ! Continuez !`;
      }
      if (currentStreak >= 7) {
        return `✨ Une semaine complète ! ${currentStreak} jours parfaits ! Impressionnant !`;
      }
      if (currentStreak >= 3) {
        return `🚀 ${currentStreak} jours consécutifs ! La routine devient une habitude !`;
      }
      if (currentStreak === 1) {
        return "🎯 Excellent début ! Revenez demain pour lancer une série !";
      }
    }

    // Pas de série active
    if (monthStats.perfectDays === 0) {
      return "💫 Votre premier jour parfait vous attend ! Vous pouvez le faire !";
    }
    if (monthStats.averageRate >= 80) {
      return "👏 Vous êtes si proche de la perfection ! Donnez tout !";
    }
    if (monthStats.perfectDays >= 5) {
      return "💪 Vous avez prouvé que vous pouvez le faire ! Lancez une série !";
    }
    return "🌱 Chaque petit pas compte. Continuez d'avancer !";
  };

  // Mémoïse les modifiers pour éviter les recalculs
  const modifiers = useMemo(
    () => ({
      low: (date: Date) => {
        const dateString = formatDateYMD(date);
        const rate = completionRates[dateString] ?? 0;
        return rate > 0 && rate < 50;
      },
      medium: (date: Date) => {
        const dateString = formatDateYMD(date);
        const rate = completionRates[dateString] ?? 0;
        return rate >= 50 && rate < 100;
      },
      high: (date: Date) => {
        const dateString = formatDateYMD(date);
        const rate = completionRates[dateString] ?? 0;
        return rate === 100;
      },
      hasDeadline: (date: Date) => {
        const dateString = formatDateYMD(date);
        return deadlineDates.has(dateString);
      },
    }),
    [completionRates, deadlineDates],
  );

  const modifiersClassNames = {
    low: "bg-orange-500/40 hover:bg-orange-500/50 text-foreground",
    medium: "bg-yellow-500/50 hover:bg-yellow-500/60 text-foreground",
    high: "bg-green-500/60 hover:bg-green-500/70 text-foreground",
    hasDeadline:
      "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-red-500",
  };

  return (
    <Card className="p-4 shadow-card relative">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Progression mensuelle</h2>
          <p className="text-sm text-muted-foreground">
            Cliquez sur un jour pour voir vos routines et les deadlines de vos
            tâches
          </p>
        </div>

        <div className="grid md:grid-cols-[1fr,240px] gap-4">
          {/* Zone principale avec calendrier */}
          <div className="space-y-4">
            <div className="bg-muted/30 p-3 rounded-lg">
              <div className="text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium mb-2 sm:mb-0 sm:mr-4">
                    Taux de réussite :
                  </span>
                  <div className="flex items-center flex-wrap gap-5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-sm bg-muted border flex-shrink-0" />
                      <span>0%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-sm bg-orange-500/40 flex-shrink-0" />
                      <span>&lt;50%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-sm bg-yellow-500/50 flex-shrink-0" />
                      <span>&lt;100%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-sm bg-green-500/60 flex-shrink-0" />
                      <span>100%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 w-full">
                  <div className="flex items-center justify-start sm:justify-end gap-1.5">
                    <div className="w-4 h-4 rounded-sm border flex-shrink-0 relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-red-500" />
                    <span>📌 Deadline</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "transition-opacity duration-200",
                isLoading && "opacity-40",
              )}
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                locale={fr}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                className={cn(
                  "py-8 rounded-md border pointer-events-auto mx-auto",
                )}
                onMonthChange={setCurrentMonth}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Panneau de motivation - visible sur mobile */}
          <div className="space-y-4">
            {/* Message de motivation personnalisé */}
            <div
              className={cn(
                "p-2.5 rounded-lg border",
                !todayComplete && currentStreak > 0
                  ? "bg-orange-500/5 border-orange-500/20"
                  : "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20",
              )}
            >
              <p className="text-sm font-medium text-center leading-relaxed">
                {getMotivationMessage()}
              </p>
            </div>

            {/* Statistiques clés */}
            <div className="bg-muted/30 py-2.5 px-4 rounded-lg">
              <h3 className="mb-2.5 underline underline-offset-2">Ce mois :</h3>
              <div className="flex flex-col items-center gap-1 sm:gap-2.5">
                {/* Jours parfaits */}
                <Card className="transition-all duration-200 hover:scale-[1.04] hover:shadow-lg hover:border-green-600/60 hover:bg-green-100/40 group cursor-pointer min-w-64 sm:min-w-40 p-0">
                  <div className="py-2 px-1 text-center">
                    <span className="inline-block text-green-600 dark:text-green-400 text-lg mb-0.5">
                      ✅
                    </span>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {monthStats.perfectDays}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Jour{monthStats.perfectDays !== 1 ? "s" : ""} parfait
                      {monthStats.perfectDays !== 1 ? "s" : ""}
                    </div>
                  </div>
                </Card>

                {/* Jours de suite (streak) */}
                <Card className="transition-all duration-200 hover:scale-[1.04] hover:shadow-lg hover:border-orange-500/60 hover:bg-orange-100/40 group cursor-pointer min-w-64 sm:min-w-40 p-0">
                  <div className="py-2 px-1 text-center">
                    <span className="inline-block text-orange-500 text-lg mb-0.5">
                      🔥
                    </span>
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {currentStreak}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Jour{currentStreak !== 1 ? "s" : ""} de suite
                    </div>
                    {!todayComplete && currentStreak >= 3 && (
                      <div className="text-[10px] text-orange-600 dark:text-orange-400 mt-1 font-semibold animate-pulse">
                        ⚠️
                      </div>
                    )}
                  </div>
                </Card>

                {/* Deadlines ce mois */}
                <Card className="transition-all duration-200 hover:scale-[1.04] hover:shadow-lg hover:border-primary/60 hover:bg-primary/10 group cursor-pointer min-w-64 sm:min-w-40 p-0">
                  <div className="py-2 px-1 text-center">
                    <span className="inline-block text-primary text-lg mb-0.5">
                      📌
                    </span>
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      {deadlineDates.size}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Deadline{deadlineDates.size !== 1 ? "s" : ""} ce mois
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Badges d'accomplissement */}
            {currentStreak >= 7 && (
              <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-4 rounded-lg border border-yellow-500/20 text-center">
                <div className="text-2xl mb-2">🏆</div>
                <p className="text-xs font-medium">Série légendaire !</p>
              </div>
            )}

            {monthStats.averageRate >= 90 && (
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-4 rounded-lg border border-blue-500/20 text-center">
                <div className="text-2xl mb-2">⭐</div>
                <p className="text-xs font-medium">Taux d'excellence !</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CalendarHeatmap;
