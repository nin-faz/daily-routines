import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Tooltip,
  Rectangle,
  type RectangleProps,
} from "recharts";
import {
  TrendingUp,
  CheckCircle,
  Flame,
  FolderKanban,
  Calendar,
  BarChart3,
  Award,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/layout/Navigation";
import Header from "@/components/layout/Header";
import { StatsSkeleton } from "@/components/stats/StatsSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import { useStats } from "@/hooks/useStats";
import {
  format,
  addDays,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from "date-fns";
import { getFrequencyLabel } from "@/lib/days";
import { formatDateYMD, getDatesOfCurrentMonth, getWeekDays } from "@/lib/date";
import { getActiveRoutinesAtDate } from "@/lib/utils";
import { fr } from "date-fns/locale";
import type { Routine } from "@/types/routine";
import { calculateStatStreak, calculateLongestStreak } from "@/lib/streak";
import React, { useState } from "react";

const CustomBarShape = (props: RectangleProps & { isTop: boolean }) => {
  const { isTop, ...rest } = props;
  return <Rectangle {...rest} radius={isTop ? [8, 8, 0, 0] : [0, 0, 0, 0]} />;
};

const Stats = () => {
  const { routines, statuses, folders, tasks, isLoading } = useStats();
  const [routineType, setRoutineType] = React.useState<
    "all" | "daily" | "weekly"
  >("all");
  const [taskFolderFilter, setTaskFolderFilter] = React.useState<string>("all");
  const [taskStatusFilter] = useState<"all" | "todo" | "done">("all");

  // Filtrage routines selon le type sélectionné
  const filteredRoutines = React.useMemo(() => {
    if (routineType === "all") return routines;
    if (routineType === "daily")
      return routines.filter((r) => !r.frequency || r.frequency === "daily");
    if (routineType === "weekly")
      return routines.filter((r) => r.frequency === "weekly");
    return routines;
  }, [routines, routineType]);

  // Calculs pour les routines
  const today = new Date();
  const firstToLastDate = getDatesOfCurrentMonth(today);

  /** Graphique X-Y : Taux de réussite sur le mois
   * Routines (complétés ou non, sautés ne sont pas pris en compte) pour le jour en question
   */
  const completionsByDate = firstToLastDate.map((date) => {
    const activeRoutines = getActiveRoutinesAtDate(
      filteredRoutines,
      statuses,
      date,
    );
    const totalRoutinesCompleted = activeRoutines.filter((completedRoutine) => {
      const statusForRoutinesCompleted = statuses.find(
        (currentStatusForRoutineCompleted) =>
          currentStatusForRoutineCompleted.date === date &&
          currentStatusForRoutineCompleted.routineId === completedRoutine.id,
      );
      return statusForRoutinesCompleted && statusForRoutinesCompleted.completed;
    }).length;
    const totalActiveRoutines = activeRoutines.length;
    return {
      date: format(new Date(date), "dd/MM"),
      taux:
        totalActiveRoutines > 0
          ? Math.round((totalRoutinesCompleted / totalActiveRoutines) * 100)
          : 0,
    };
  });

  /** Taux global : pour chaque jour jusqu'à aujourd'hui, on compte toutes les routines actives (même sans statut) */
  let totalRoutinesCompleted = 0;
  let totalRoutines = 0;
  const datesUpToToday = firstToLastDate.filter(
    (date) => date <= formatDateYMD(today),
  );

  datesUpToToday.forEach((date) => {
    const activeRoutines = getActiveRoutinesAtDate(
      filteredRoutines,
      statuses,
      date,
    );
    activeRoutines.forEach((routine) => {
      const status = statuses.find(
        (s) => s.date === date && s.routineId === routine.id,
      );
      totalRoutines++;
      if (status?.completed) {
        totalRoutinesCompleted++;
      }
    });
  });

  /** Score global : Taux de routines */
  const overallCompletionRate =
    totalRoutines > 0
      ? Math.round((totalRoutinesCompleted / totalRoutines) * 100)
      : 0;

  // Génère toutes les dates depuis la première routine jusqu'à aujourd'hui (pour les streaks)
  const allRoutineDates = (() => {
    if (filteredRoutines.length === 0) return [];
    const firstDate = filteredRoutines.reduce((min, r) => {
      const d =
        typeof r.createdAt === "string" ? new Date(r.createdAt) : r.createdAt;
      return d < min ? d : min;
    }, new Date());
    const dates: string[] = [];
    let d = new Date(firstDate);
    while (formatDateYMD(d) <= formatDateYMD(today)) {
      dates.push(formatDateYMD(d));
      d.setDate(d.getDate() + 1);
    }
    return dates;
  })();

  // Streak global courant
  const currentStreak = calculateStatStreak(
    routines,
    statuses,
    allRoutineDates,
  );
  // Record de streak global
  const recordStreak = calculateLongestStreak(
    routines,
    statuses,
    allRoutineDates,
  );

  // Tâches avec deadline proche (7 jours)
  const upcomingDeadlines = tasks.filter((task) => {
    if (!task.deadline || task.status === "done") return false;
    const deadline = new Date(task.deadline + "T00:00:00");
    // Vérifie si la deadline est entre le début d'aujourd'hui et la fin des 7 prochains jours
    const start = startOfDay(today);
    const end = endOfDay(addDays(today, 7));
    return isWithinInterval(deadline, { start, end });
  }).length;

  // Filtre des tâches selon dossier / statut sélectionné
  const filteredTasks = React.useMemo(() => {
    return tasks.filter((t) => {
      const folderMatch =
        taskFolderFilter === "all"
          ? true
          : taskFolderFilter === "unfiled"
            ? !t.folderId
            : t.folderId === taskFolderFilter;
      const statusMatch =
        taskStatusFilter === "all" ? true : t.status === taskStatusFilter;
      return folderMatch && statusMatch;
    });
  }, [tasks, taskFolderFilter, taskStatusFilter]);

  // Cette semaine
  const weekDays = getWeekDays(today, { weekStartsOn: 1 });

  /** Graphique de la semaine : routines existantes à chaque jour (selon filtre) */
  type WeeklyData = {
    jour: string;
    complétées: number;
    sautees: number;
    total: number;
  };
  const weeklyData: WeeklyData[] = weekDays.map((day: Date) => {
    const formatedDate = formatDateYMD(day);
    // On prend toutes les routines existantes à la date (même skipped), mais filtrées selon le type sélectionné
    const routinesAtDate = filteredRoutines.filter((routine: Routine) => {
      const dateCreated =
        typeof routine.createdAt === "string"
          ? new Date(routine.createdAt)
          : routine.createdAt;
      return formatDateYMD(dateCreated) <= formatedDate;
    });
    let routinesCompleted = 0;
    let routinesSautees = 0;
    routinesAtDate.forEach((routine: Routine) => {
      const statusForRoutine = statuses.find(
        (statusForRoutine) =>
          statusForRoutine.date === formatedDate &&
          statusForRoutine.routineId === routine.id,
      );
      if (statusForRoutine?.skipped) {
        routinesSautees++;
      } else if (statusForRoutine?.completed) {
        routinesCompleted++;
      }
    });
    return {
      jour: format(day, "EEE", { locale: fr }),
      complétées: routinesCompleted,
      sautees: routinesSautees,
      total: routinesAtDate.length,
    };
  });

  /** Calcul du max de routines existantes sur la semaine (pour l'axe Y)
   *  (ex : [2, 3, 1, 0, 2, 2, 1]) <=
   */
  const maxRoutinesThisWeek = Math.max(...weeklyData.map((d) => d.total), 1);

  // Statistiques des dossiers
  const tasksByStatus = {
    todo: filteredTasks.filter((task) => task.status === "todo").length,
    done: filteredTasks.filter((task) => task.status === "done").length,
  };

  const totalTasks = tasks.length;

  /** Score global : Taux de tâches */
  const tasksCompletionRate =
    totalTasks > 0 ? Math.round((tasksByStatus.done / totalTasks) * 100) : 0;

  const pieData = [
    {
      name: "À faire",
      value: tasksByStatus.todo,
      color: "hsl(var(--muted))",
    },
    {
      name: "Terminé",
      value: tasksByStatus.done,
      color: "hsl(var(--primary))",
    },
  ].filter((dataForProject) => dataForProject.value > 0);

  return (
    <div className="min-h-screen bg-gradient-bg pb-20 md:pb-24">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-3xl">
        <header className="mb-6 sm:mb-8">
          <Header />
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Mes Statistiques
            </h1>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm sm:text-base text-muted-foreground text-center">
              Suivez vos progrès et performances
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={routineType}
                onValueChange={(v) => setRoutineType(v as any)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les routines</SelectItem>
                  <SelectItem value="daily">Quotidiennes</SelectItem>
                  <SelectItem value="weekly">Hebdomadaires</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        {isLoading ? (
          <StatsSkeleton />
        ) : routines.length === 0 && folders.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Pas encore de données"
            description="Créez des routines et des dossiers pour voir vos statistiques apparaître ici !"
          />
        ) : (
          <>
            {/* KPIs principaux */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
              <Card className="transition-all duration-200 hover:scale-[1.04] hover:shadow-lg hover:border-primary/60 hover:bg-primary/5">
                <CardContent className="p-3 sm:p-4 text-center flex flex-col justify-center h-full">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {overallCompletionRate}%
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Taux routines
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:scale-[1.04] hover:shadow-lg hover:border-primary/60 hover:bg-primary/5">
                <CardContent className="p-3 sm:p-4 text-center flex flex-col justify-center h-full">
                  <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {currentStreak}
                  </p>
                  <div className="flex justify-center mt-1 mb-1">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Record : {recordStreak}
                    </Badge>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Jours de suite
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:scale-[1.04] hover:shadow-lg hover:border-primary/60 hover:bg-primary/5">
                <CardContent className="p-3 sm:p-4 text-center flex flex-col justify-center h-full">
                  <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {tasksCompletionRate}%
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Tâches terminées
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:scale-[1.04] hover:shadow-lg hover:border-primary/60 hover:bg-primary/5">
                <CardContent className="p-3 sm:p-4 text-center flex flex-col justify-center h-full">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-1 sm:mb-2" />
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {upcomingDeadlines}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Deadlines 7j
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Évolution sur le mois */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    {`Taux de réussite (${firstToLastDate.length} jours)`}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
                  <div className="h-40 sm:h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={completionsByDate}>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 9 }}
                          interval={8}
                        />
                        <YAxis
                          tick={{ fontSize: 9 }}
                          domain={[0, 100]}
                          width={30}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload[0]) {
                              // Routines actives ce jour-là
                              const routinesForDay = getActiveRoutinesAtDate(
                                filteredRoutines,
                                statuses,
                                firstToLastDate[
                                  payload[0].payload?.index || 0
                                ] || label,
                              );
                              return (
                                <div className="bg-card border rounded-lg p-2 shadow-lg min-w-[160px]">
                                  <div className="font-semibold mb-1">
                                    {label}
                                  </div>
                                  <div className="mb-1 text-xs text-muted-foreground">
                                    Taux : {payload[0].value}%
                                  </div>
                                  <div className="text-xs">
                                    {routinesForDay.length === 0 ? (
                                      <span>Aucune routine</span>
                                    ) : (
                                      routinesForDay.map((r) => (
                                        <div
                                          key={r.id}
                                          className="flex items-center gap-1"
                                        >
                                          <span>{r.title}</span>
                                          <span className="ml-1 text-[10px] text-muted-foreground">
                                            ({getFrequencyLabel(r.frequency)})
                                          </span>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="taux"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cette semaine */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">
                    Routines cette semaine
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
                  <div className="h-40 sm:h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <XAxis dataKey="jour" tick={{ fontSize: 9 }} />
                        <YAxis
                          tick={{ fontSize: 9 }}
                          width={30}
                          domain={[0, maxRoutinesThisWeek]}
                        />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === "complétées")
                              return [value, "Complétées"];
                            if (name === "sautees") return [value, "Sautées"];
                            if (name === "ratees") return [value, "Ratées"];
                            return [value, name];
                          }}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar
                          dataKey="complétées"
                          stackId="a"
                          fill="hsl(var(--primary))"
                          shape={(barProps: any) => (
                            <CustomBarShape
                              {...barProps}
                              isTop={
                                !barProps.payload.sautees ||
                                barProps.payload.sautees === 0
                              }
                            />
                          )}
                        />
                        <Bar
                          dataKey="sautees"
                          stackId="a"
                          fill="#fbbf24"
                          shape={(barProps: any) => (
                            <CustomBarShape
                              {...barProps}
                              isTop={barProps.payload.sautees > 0}
                            />
                          )}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Répartition des tâches */}
            {totalTasks > 0 && (
              <Card>
                <div className="flex items-center justify-between p-5">
                  <CardHeader className="p-0">
                    <CardTitle className="text-sm font-medium">
                      Répartition des tâches par dossier
                    </CardTitle>
                  </CardHeader>
                  <Select
                    value={taskFolderFilter}
                    onValueChange={(v) => setTaskFolderFilter(v as string)}
                  >
                    <SelectTrigger className="w-48 md:w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les tâches</SelectItem>
                      <SelectItem value="unfiled">Sans dossier</SelectItem>
                      {folders.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <CardContent>
                  <div className="flex items-center justify-center gap-8">
                    <div className="h-40 w-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-muted" />
                        <span className="text-sm">
                          À faire: {tasksByStatus.todo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-sm">
                          Terminé: {tasksByStatus.done}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Résumé avec breakdown par type de routine */}
            <div className="mt-8 flex flex-wrap justify-center gap-2 text-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {routines.length} routine{routines.length > 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium text-xs">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {(() => {
                  const quotidiennes = routines.filter(
                    (r) => !r.frequency || r.frequency === "daily",
                  ).length;
                  const hebdos = routines.filter(
                    (r) => r.frequency === "weekly",
                  ).length;
                  return (
                    <>
                      {quotidiennes} quotidienne{quotidiennes > 1 ? "s" : ""}
                      <span className="mx-1">/</span>
                      {hebdos} hebdo{hebdos > 1 ? "s" : ""}
                    </>
                  );
                })()}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-semibold text-sm">
                {folders.length} dossier{folders.length > 1 ? "s" : ""}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold text-sm">
                {totalTasks} tâche{totalTasks > 1 ? "s" : ""}
              </span>
            </div>
          </>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default Stats;
