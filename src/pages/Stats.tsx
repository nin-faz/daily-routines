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
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/layout/Navigation";
import Header from "@/components/layout/Header";
import { StatsSkeleton } from "@/components/stats/StatsSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import { useStats } from "@/hooks/useStats";
import { format, subDays, isWithinInterval } from "date-fns";
import { formatDateYMD, getDatesOfCurrentMonth, getWeekDays } from "@/lib/date";
import { getActiveRoutinesAtDate } from "@/lib/utils";
import { fr } from "date-fns/locale";
import type { Routine } from "@/types/routine";
import { calculateStatStreak, calculateLongestStreak } from "@/lib/streak";

const CustomBarShape = (props: RectangleProps & { isTop: boolean }) => {
  const { isTop, ...rest } = props;
  return <Rectangle {...rest} radius={isTop ? [8, 8, 0, 0] : [0, 0, 0, 0]} />;
};

const Stats = () => {
  const { routines, statuses, projects, tasks, isLoading } = useStats();

  // Calculs pour les routines
  const today = new Date();
  const firstToLastDate = getDatesOfCurrentMonth(today);

  /** Graphique X-Y : Taux de complétion sur le mois
   * Routines (complétés ou non, sautés ne sont pas pris en compte) pour le jour en question
   */
  const completionsByDate = firstToLastDate.map((date) => {
    const activeRoutines = getActiveRoutinesAtDate(routines, statuses, date);
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

  /** Taux global : pour chaque jour, on compte toutes les routines existantes ce jour-là (même sans statut) */
  let totalRoutinesCompleted = 0;
  let totalRoutines = 0;
  firstToLastDate.forEach((date) => {
    const activeRoutines = getActiveRoutinesAtDate(routines, statuses, date);
    totalRoutines += activeRoutines.length;
    activeRoutines.forEach((routine) => {
      const status = statuses.find(
        (statusForRoutine) =>
          statusForRoutine.date === date &&
          statusForRoutine.routineId === routine.id,
      );
      if (status && status.completed) {
        totalRoutinesCompleted++;
      }
    });
  });

  /** Taux de complétion global : Taux de routines */
  const overallCompletionRate =
    totalRoutines > 0
      ? Math.round((totalRoutinesCompleted / totalRoutines) * 100)
      : 0;

  // Génère toutes les dates depuis la première routine jusqu'à aujourd'hui
  const allRoutineDates = (() => {
    if (routines.length === 0) return [];
    const firstDate = routines.reduce((min, r) => {
      const d =
        typeof r.createdAt === "string" ? new Date(r.createdAt) : r.createdAt;
      return d < min ? d : min;
    }, new Date());
    const todayYMD = formatDateYMD(today);
    const dates: string[] = [];
    let d = new Date(firstDate);
    while (formatDateYMD(d) <= todayYMD) {
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
    const deadline = new Date(task.deadline);
    // Vérifie si la deadline est dans les 7 prochains jours
    const sevenDaysFromNow = subDays(today, -7);
    return isWithinInterval(deadline, { start: today, end: sevenDaysFromNow });
  }).length;

  // Cette semaine
  const weekDays = getWeekDays(today, { weekStartsOn: 1 });

  /** Graphique de la semaine : routines existantes à chaque jour */
  type WeeklyData = {
    jour: string;
    complétées: number;
    sautees: number;
    total: number;
  };
  const weeklyData: WeeklyData[] = weekDays.map((day: Date) => {
    const formatedDate = formatDateYMD(day);
    // On prend toutes les routines existantes à la date (même skipped)
    const routinesAtDate = routines.filter((routine: Routine) => {
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

  // Statistiques des projets
  const tasksByStatus = {
    todo: tasks.filter((task) => task.status === "todo").length,
    doing: tasks.filter((task) => task.status === "doing").length,
    done: tasks.filter((task) => task.status === "done").length,
  };

  const totalTasks = tasks.length;

  /** Taux de complétion global : Taux de tâches */
  const projectCompletionRate =
    totalTasks > 0 ? Math.round((tasksByStatus.done / totalTasks) * 100) : 0;

  const pieData = [
    { name: "À faire", value: tasksByStatus.todo, color: "hsl(var(--muted))" },
    {
      name: "En cours",
      value: tasksByStatus.doing,
      color: "hsl(var(--primary) / 0.6)",
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
          <p className="text-sm sm:text-base text-muted-foreground text-center">
            Suivez vos progrès et performances
          </p>
        </header>

        {isLoading ? (
          <StatsSkeleton />
        ) : routines.length === 0 && projects.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Pas encore de données"
            description="Créez des routines et des projets pour voir vos statistiques apparaître ici !"
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
                      variant="secondary"
                      className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold"
                    >
                      <Award className="w-3.5 h-3.5 text-primary" />
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
                    {projectCompletionRate}%
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
                    {`Taux de complétion (${firstToLastDate.length} jours)`}
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
                          formatter={(value) => [`${value}%`, "Taux"]}
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
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Répartition des tâches projet
                  </CardTitle>
                </CardHeader>
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
                        <div className="w-3 h-3 rounded-full bg-primary/60" />
                        <span className="text-sm">
                          En cours: {tasksByStatus.doing}
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

            {/* Résumé */}
            <div className="mt-8 text-center text-muted-foreground">
              <p className="text-sm">
                {routines.length} routine{routines.length > 1 ? "s" : ""} •{" "}
                {projects.length} projet{projects.length > 1 ? "s" : ""} •{" "}
                {totalTasks} tâche{totalTasks > 1 ? "s" : ""}
              </p>
            </div>
          </>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default Stats;
