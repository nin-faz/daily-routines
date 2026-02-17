import { useParams, useNavigate } from "react-router-dom";
import { getTodayString } from "@/integrations/supabase/routines";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  Flame,
  Award,
  Sparkles,
  Clock,
} from "lucide-react";
import { getTimeOfDayLabel, getFrequencyLabel } from "@/lib/days";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useMemo } from "react";
import { useStats } from "@/hooks/useStats";
import { useRoutines } from "@/hooks/useRoutines";
import useRoutineStatuses from "@/hooks/useRoutineStatuses";
import { calculateStatStreak, calculateLongestStreak } from "@/lib/streak";
import { getDatesBetween, getDatesOfCurrentMonth } from "@/lib/date";

const RoutineHistory = () => {
  const { routineId } = useParams<{ routineId: string }>();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { routines: allRoutines, isLoading: isLoadingStats } = useStats();
  const { routines: routinesToday, isLoading } = useRoutines();

  const routines = allRoutines.length ? allRoutines : routinesToday;

  if (!routineId) {
    navigate("/");
    return null;
  }

  // Recherche la routine dans les données mises en cache
  const routine = routines.find((r) => r.id === routineId) ?? null;

  // Utilise le hook dédié pour récupérer les statuts de la routine (mis en cache)
  const {
    statuses: routineStatuses = [],
    isLoading: isLoadingRoutineStatuses,
  } = useRoutineStatuses(routineId);

  const allStatuses = routineStatuses;

  if (!routine) {
    // Si les requêtes sont encore en chargement, éviter un redirection brutale — ne rien afficher tant que c'est chargé
    if (isLoading || isLoadingStats || isLoadingRoutineStatuses) return null;
    navigate("/");
    return null;
  }

  // Memo pour éviter recalculs inutiles
  const completedStatuses = allStatuses.filter((s) => s.completed);
  const completedDates = completedStatuses.map((s) => s.date).sort();

  const filteredCompletedDates = useMemo(() => {
    return completedDates.filter((date) => {
      const d = parseISO(date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [completedDates, selectedMonth, selectedYear]);

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
  // Prépare les données du graphique pour le mois sélectionné
  const chartData = useMemo(() => {
    const monthDates = getDatesOfCurrentMonth(
      new Date(selectedYear, selectedMonth),
    );
    return monthDates.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const isCompleted = completedDates.includes(dateStr);
      return {
        date: format(day, "dd/MM"),
        fullDate: dateStr,
        completed: isCompleted ? 1 : 0,
      };
    });
  }, [completedDates, selectedMonth, selectedYear]);

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4 focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Retour à l'accueil"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

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
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all hover:bg-primary/15">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">
                    {getFrequencyLabel(routine.frequency)}
                  </span>
                </div>
              )}

              {/* Badge Moment de la journée */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm transition-all
                ${
                  routine.timeOfDay
                    ? "bg-secondary/10 text-secondary-foreground border-secondary/20"
                    : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50"
                }`}
              >
                {/* Icone dynamique : Soit l'icône du moment, soit Sparkles si non-défini */}
                {routine.timeOfDay ? (
                  <>
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">
                      {getTimeOfDayLabel(routine.timeOfDay)?.label}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">
                      À votre rythme
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="transition-all duration-200 hover:scale-[1.04] hover:shadow-lg hover:border-primary/60 hover:bg-primary/5">
            <CardContent className="p-3 sm:p-4 text-center flex flex-col justify-center h-full">
              <div className="mx-auto mb-2 p-2 rounded-lg bg-primary/10 inline-flex">
                <Calendar className="h-5 w-5 text-primary" />
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
                <TrendingUp className="h-5 w-5 text-green-600" />
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
                <Flame className="h-5 w-5 text-primary" />
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
                <Award className="h-5 w-5 text-secondary" />
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

        {/* Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              Activité des {firstToLastDate.length} derniers jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis hide />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div
                          className="bg-card border rounded-lg p-2 shadow-lg"
                          aria-live="polite"
                        >
                          <p className="text-sm font-semibold">
                            {format(parseISO(data.fullDate), "dd MMMM yyyy", {
                              locale: fr,
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {data.completed ? "✓ Complété" : "✗ Non complété"}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry: { completed: any }, index: any) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.completed
                          ? "hsl(var(--primary))"
                          : "hsl(var(--muted))"
                      }
                      aria-label={
                        entry.completed ? "Jour complété" : "Jour non complété"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
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
    </div>
  );
};

export default RoutineHistory;
