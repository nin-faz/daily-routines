import { useParams, useNavigate } from "react-router-dom";
import { getTodayString } from "@/shared/lib/date";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  Flame,
  Award,
  Sparkles,
  Clock,
} from "lucide-react";
import { getTimeOfDayLabel, getFrequencyLabel, JS_DAY_TO_DAY_OF_WEEK } from "@/shared/lib/days";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useMemo } from "react";
import { useStats } from "@/application/hooks/useStats";
import { useRoutines } from "@/application/hooks/useRoutines";
import useRoutineStatuses from "@/application/hooks/useRoutineStatuses";
import { usePageTitle } from "@/application/hooks/usePageTitle";
import { calculateStatStreak, calculateLongestStreak } from "@/domain/streak";
import { getDatesBetween, getDatesOfCurrentMonth } from "@/shared/lib/date";

const RoutineDetails = () => {
  const { routineId } = useParams<{ routineId: string }>();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { routines: allRoutines, isLoading: isLoadingStats } = useStats();
  const { routines: routinesToday, isLoading } = useRoutines();

  const routines = allRoutines.length ? allRoutines : routinesToday;

  if (!routineId) {
    navigate("/dashboard");
    return null;
  }

  // Recherche la routine dans les données mises en cache
  const routine = routines.find((r) => r.id === routineId) ?? null;
  usePageTitle(routine?.title ?? "Détail de la routine");

  // Utilise le hook dédié pour récupérer les statuts de la routine (mis en cache)
  const {
    statuses: routineStatuses = [],
    isLoading: isLoadingRoutineStatuses,
  } = useRoutineStatuses(routineId);

  const allStatuses = routineStatuses;
  // Memo pour éviter recalculs inutiles
  const completedStatuses = allStatuses.filter((s) => s.completed);
  const completedDates = completedStatuses.map((s) => s.date).sort();

  const filteredCompletedDates = useMemo(() => {
    return completedDates.filter((date) => {
      const d = parseISO(date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [completedDates, selectedMonth, selectedYear]);

  // Prépare les données du graphique pour le mois sélectionné
  const chartData = useMemo(() => {
    const monthDates = getDatesOfCurrentMonth(
      new Date(selectedYear, selectedMonth),
    );
    return monthDates.map((day) => {
      // day est déjà en format 'yyyy-MM-dd' (retour de getDatesOfCurrentMonth)
      const isCompleted = completedDates.includes(day);
      return {
        date: day.slice(8, 10) + "/" + day.slice(5, 7), // yyyy-MM-dd → dd/MM
        fullDate: day,
        completed: isCompleted ? 1 : 0,
      };
    });
  }, [completedDates, selectedMonth, selectedYear]);

  // Jours planifiés ce mois selon la fréquence de la routine
  const monthSummary = useMemo(() => {
    const today = getTodayString();
    const pastDays = chartData.filter(e => e.fullDate <= today);
    const completedCount = pastDays.filter(e => e.completed).length;

    if (!routine) return { planned: 0, completed: completedCount };

    let planned = 0;
    if (routine.frequency === "daily") {
      planned = pastDays.length;
    } else {
      // Hebdomadaire : compter les jours planifiés passés ce mois
      const weekDays = routine.weekDays ?? [];
      planned = pastDays.filter(e => {
        const jsDay = new Date(e.fullDate + "T00:00:00").getDay();
        const dayName = JS_DAY_TO_DAY_OF_WEEK[jsDay];
        return weekDays.includes(dayName);
      }).length;
    }

    return { planned, completed: completedCount };
  }, [chartData, routine]);

  if (!routine) {
    // Si les requêtes sont encore en chargement, éviter un redirection brutale — ne rien afficher tant que c'est chargé
    if (isLoading || isLoadingStats || isLoadingRoutineStatuses) return null;
    navigate("/dashboard");
    return null;
  }

  // Génère les années et mois disponibles depuis la création jusqu'à aujourd'hui
  const creationYear = parseISO(routine.createdAt).getFullYear();
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(
    { length: currentYear - creationYear + 1 },
    (_, i) => currentYear - i,
  );

  const monthsInSelectedYear = (() => {
    const now = new Date();
    if (selectedYear === currentYear) {
      // Pour l'année en cours, afficher jusqu'au mois actuel
      return Array.from({ length: now.getMonth() + 1 }, (_, i) => i);
    } else if (selectedYear === creationYear) {
      // Pour l'année de création, afficher à partir du mois de création
      const creationMonth = parseISO(routine.createdAt).getMonth();
      return Array.from(
        { length: 12 - creationMonth },
        (_, i) => creationMonth + i,
      );
    } else {
      // Pour les autres années, afficher tous les mois
      return Array.from({ length: 12 }, (_, i) => i);
    }
  })();

  // Calcul des statistiques
  const totalCompletions = completedDates.length;

  // Prépare la liste de dates depuis la création de la routine jusqu'à aujourd'hui
  const allRoutineDates = getDatesBetween(
    typeof routine.createdAt === "string"
      ? new Date(routine.createdAt)
      : routine.createdAt,
    new Date(),
  );

  const currentStreak = calculateStatStreak(
    [routine],
    allStatuses,
    allRoutineDates,
  );
  const longestStreak = calculateLongestStreak(
    [routine],
    allStatuses,
    allRoutineDates,
  );

  // Compte le nombre de jours calendaires depuis la création
  const creationDate = format(parseISO(routine.createdAt), "yyyy-MM-dd");
  const today = getTodayString();
  const daysSinceCreation = differenceInDays(
    parseISO(today),
    parseISO(creationDate),
  );

  // Compte les jours sautés pour les exclure du calcul
  const skippedDays = allStatuses.filter((s) => s.skipped).length;
  const totalCalendarDays = daysSinceCreation + 1; // +1 pour inclure le jour de création
  const activeDays = Math.max(1, totalCalendarDays - skippedDays);

  // Le taux est plafonné à 100%
  const completionRate = Math.min(
    100,
    Math.round((totalCompletions / activeDays) * 100),
  );

  const firstToLastDate = getDatesOfCurrentMonth(new Date());

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-start gap-2">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Retour à l'accueil"
              >
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Retour
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" aria-hidden="true" />
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Ma routine
              </h1>
            </div>
          </div>

          <hr className="border-border w-full mb-6" />

          <h1 className="text-3xl font-bold text-foreground">
            {routine.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            Créée le{" "}
            {format(parseISO(routine.createdAt), "dd MMMM yyyy", {
              locale: fr,
            })}
          </p>
          {/* Affichage élégant des propriétés fréquence et moment */}
          {(routine.frequency || routine.timeOfDay || !routine.timeOfDay) && (
            <div className="flex flex-wrap gap-3 mt-6">
              {/* Badge Fréquence */}
              {routine.frequency && (
                <Badge className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {getFrequencyLabel(routine.frequency)}
                </Badge>
              )}

              {/* Badge Moment de la journée */}
              <Badge
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide inline-flex items-center gap-2 ${
                  routine.timeOfDay
                    ? "bg-secondary/10 text-secondary-foreground border-secondary/20"
                    : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50"
                }`}
              >
                {routine.timeOfDay ? (
                  <>
                    <Clock className="h-4 w-4" />
                    {getTimeOfDayLabel(routine.timeOfDay)?.label}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />À votre rythme
                  </>
                )}
              </Badge>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="transition-all duration-200 hover:scale-[1.04] hover:shadow-lg hover:border-primary/60 hover:bg-primary/5">
            <CardContent className="p-3 sm:p-4 text-center flex flex-col justify-center h-full">
              <div className="mx-auto mb-2 p-2 rounded-lg bg-primary/10 inline-flex">
                <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {totalCompletions}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Jours complétés
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:scale-[1.04] hover:shadow-lg hover:border-primary/60 hover:bg-primary/5">
            <CardContent className="p-3 sm:p-4 text-center flex flex-col justify-center h-full">
              <div className="mx-auto mb-2 p-2 rounded-lg bg-green-500/10 inline-flex">
                <TrendingUp className="h-5 w-5 text-green-600" aria-hidden="true" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {completionRate}%
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Taux de réussite
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:scale-[1.04] hover:shadow-lg hover:border-primary/60 hover:bg-primary/5">
            <CardContent className="p-3 sm:p-4 text-center flex flex-col justify-center h-full">
              <div className="mx-auto mb-2 p-2 rounded-lg bg-primary/10 inline-flex">
                <Flame className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {currentStreak}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Série actuelle
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:scale-[1.04] hover:shadow-lg hover:border-primary/60 hover:bg-primary/5">
            <CardContent className="p-3 sm:p-4 text-center flex flex-col justify-center h-full">
              <div className="mx-auto mb-2 p-2 rounded-lg bg-secondary/10 inline-flex">
                <Award className="h-5 w-5 text-secondary" aria-hidden="true" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {longestStreak}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Meilleure série
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Area chart — taux cumulé */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>
                Activité — {format(new Date(selectedYear, selectedMonth), "MMMM yyyy", { locale: fr })}
              </CardTitle>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">{monthSummary.completed}</span>
                <span className="text-sm text-muted-foreground"> / {monthSummary.planned} jour{monthSummary.planned > 1 ? "s" : ""}</span>
              </div>
            </div>
            {monthSummary.planned > 0 && (
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-2">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.round((monthSummary.completed / monthSummary.planned) * 100))}%`,
                    background: "var(--gradient-primary)",
                  }}
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData.filter(e => e.fullDate <= getTodayString())} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-card border rounded-lg px-3 py-2 shadow-lg text-xs">
                          <p className="font-semibold">{format(parseISO(d.fullDate), "dd MMMM yyyy", { locale: fr })}</p>
                          <p className="text-muted-foreground">{d.completed ? "✓ Complété" : "✗ Non complété"}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#areaGradient)"
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (!payload.completed) return <g key={props.key} />;
                    return (
                      <circle
                        key={props.key}
                        cx={cx}
                        cy={cy}
                        r={3}
                        fill="hsl(var(--primary))"
                        stroke="hsl(var(--background))"
                        strokeWidth={1.5}
                      />
                    );
                  }}
                  activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completion History */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle>Historique des jours complétés</CardTitle>
              <div className="flex flex-row gap-2 items-start sm:items-center">
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="sm:w-[110px] w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger className="sm:w-[140px] w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthsInSelectedYear.map((month) => {
                      const date = new Date(selectedYear, month);
                      return (
                        <SelectItem key={month} value={month.toString()}>
                          {format(date, "MMMM", { locale: fr })}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredCompletedDates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p
                  className="text-center text-muted-foreground"
                  aria-live="polite"
                >
                  {completedDates.length === 0
                    ? "Pas encore de routines complétées"
                    : "Aucune routine complétée ce mois-ci"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[...filteredCompletedDates].reverse().map((date) => {
                  const status = allStatuses.find((s) => s.date === date);
                  return (
                    <div
                      key={date}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 focus-within:ring-2 focus-within:ring-primary"
                      tabIndex={0}
                      aria-label={`Routine complétée le ${format(parseISO(date), "EEEE dd MMMM yyyy", { locale: fr })}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-2 w-2 rounded-full bg-green-600"
                          aria-hidden="true"
                        />
                        <span className="font-medium capitalize">
                          {format(parseISO(date), "EEEE dd MMMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                      {status?.completedAt && (
                        <span className="text-sm text-muted-foreground">
                          {format(parseISO(status.completedAt), "HH:mm")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default RoutineDetails;
