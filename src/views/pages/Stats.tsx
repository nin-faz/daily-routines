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
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import Navigation from "@/application/components/layout/Navigation";
import Header from "@/application/components/layout/Header";
import { StatsSkeleton } from "@/views/components/stats/StatsSkeleton";
import EmptyState from "@/shared/components/EmptyState";
import { useStats } from "@/application/hooks/useStats";
import { format } from "date-fns";
import { getFrequencyLabel } from "@/shared/lib/days";
import { formatDateYMD, getDatesOfCurrentMonth, getWeekDays } from "@/shared/lib/date";
import { getActiveRoutinesAtDate } from "@/domain/routineRules";
import { fr } from "date-fns/locale";
import {
  computeCompletionsByDate,
  computeOverallCompletionRate,
  computeWeeklyData,
  computeStreaks,
  computeTasksByStatus,
  computeTasksCompletionRate,
  computeUpcomingDeadlines,
  getRoutineDateRange,
} from "@/application/services/statsService";
import React, { useState } from "react";
import { usePageTitle } from "@/application/hooks/usePageTitle";

const CustomBarShape = (props: RectangleProps & { isTop: boolean }) => {
  const { isTop, ...rest } = props;
  return <Rectangle {...rest} radius={isTop ? [8, 8, 0, 0] : [0, 0, 0, 0]} />;
};

const Stats = () => {
  usePageTitle("Statistiques");
  const { routines, statuses, folders, tasks, isLoading } = useStats();
  const [routineType, setRoutineType] = React.useState<
    "all" | "daily" | "weekly"
  >("all");
  const [taskFolderFilter, setTaskFolderFilter] = React.useState<string>("all");
  const [taskStatusFilter] = useState<"all" | "todo" | "done">("all");

  // Filtrage routines actives (non archivées) puis selon le type sélectionné
  const activeRoutines = React.useMemo(
    () => routines.filter((r) => !r.isArchived),
    [routines],
  );
  const filteredRoutines = React.useMemo(() => {
    if (routineType === "all") return activeRoutines;
    if (routineType === "daily")
      return activeRoutines.filter(
        (r) => !r.frequency || r.frequency === "daily",
      );
    if (routineType === "weekly")
      return activeRoutines.filter((r) => r.frequency === "weekly");
    return activeRoutines;
  }, [activeRoutines, routineType]);

  const today = new Date();
  const firstToLastDate = getDatesOfCurrentMonth(today);
  const datesUpToToday = firstToLastDate.filter((date) => date <= formatDateYMD(today));
  const weekDays = getWeekDays(today, { weekStartsOn: 1 });

  const completionsByDate = React.useMemo(
    () => computeCompletionsByDate(filteredRoutines, statuses, firstToLastDate),
    [filteredRoutines, statuses, firstToLastDate]
  );

  const overallCompletionRate = React.useMemo(
    () => computeOverallCompletionRate(filteredRoutines, statuses, datesUpToToday),
    [filteredRoutines, statuses, datesUpToToday]
  );

  const allRoutineDates = React.useMemo(
    () => getRoutineDateRange(filteredRoutines, today),
    [filteredRoutines]
  );

  const { currentStreak, recordStreak } = React.useMemo(
    () => computeStreaks(routines, statuses, allRoutineDates),
    [routines, statuses, allRoutineDates]
  );

  const upcomingDeadlines = React.useMemo(
    () => computeUpcomingDeadlines(tasks, today),
    [tasks]
  );

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

  const weeklyData = React.useMemo(
    () => computeWeeklyData(filteredRoutines, statuses, weekDays, (day) =>
      format(day, "EEE", { locale: fr })
    ),
    [filteredRoutines, statuses, weekDays]
  );

  const maxRoutinesThisWeek = Math.max(...weeklyData.map((d) => d.total), 1);

  const tasksByStatus = React.useMemo(
    () => computeTasksByStatus(filteredTasks),
    [filteredTasks]
  );

  const totalTasks = tasks.length;

  const tasksCompletionRate = React.useMemo(
    () => computeTasksCompletionRate(tasks),
    [tasks]
  );

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
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" aria-hidden="true" />
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
                aria-label="Filtrer par type de routine"
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
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-1 sm:mb-2" aria-hidden="true" />
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
                  <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-1 sm:mb-2" aria-hidden="true" />
                  <p className="text-xl sm:text-2xl font-bold text-foreground">
                    {currentStreak}
                  </p>
                  <div className="flex justify-center mt-1 mb-1">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
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
                  <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-1 sm:mb-2" aria-hidden="true" />
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
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary mx-auto mb-1 sm:mb-2" aria-hidden="true" />
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
                  <div
                    className="h-40 sm:h-48"
                    role="img"
                    aria-label={`Graphique en ligne : taux de réussite des routines sur ${firstToLastDate.length} jours`}
                  >
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
                  <div
                    className="h-40 sm:h-48"
                    role="img"
                    aria-label="Graphique en barres : routines complétées et jours de repos cette semaine"
                  >
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
                            if (name === "sautees") return [value, "Jours de repos"];
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
                    <div
                      className="h-40 w-40"
                      role="img"
                      aria-label={`Graphique circulaire : ${tasksByStatus.todo} tâche${tasksByStatus.todo > 1 ? "s" : ""} à faire, ${tasksByStatus.done} terminée${tasksByStatus.done > 1 ? "s" : ""}`}
                    >
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
