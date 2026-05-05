import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";
import {
  Flame,
  ArrowRight,
  Sunrise,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  Circle,
  ClipboardList,
  Coffee,
  Plus,
} from "lucide-react";
import robotAnimation from "@/assets/animations/robot.json";
import Header from "@/application/components/layout/Header";
import Navigation from "@/application/components/layout/Navigation";
import { useStats } from "@/application/hooks/useStats";
import { useRoutines } from "@/application/hooks/useRoutines";
import { useAuth } from "@/application/context/AuthContext";
import { formatFrenchDate, getTodayString } from "@/shared/lib/date";
import { usePageTitle } from "@/application/hooks/usePageTitle";
import { TimeOfDay } from "@/shared/types/routine";
import { Status } from "@/shared/types/task";
import { getTodaysRoutines, JS_DAY_TO_DAY_OF_WEEK } from "@/shared/lib/days";
import type { DayStatus } from "@/application/services/statsService";
import type { Routine } from "@/shared/types/routine";
import type { RoutineStatus } from "@/shared/types/routine";
import { Button } from "@/shared/components/ui/button";
import CreateRoutineDialog from "@/views/components/routine/CreateRoutineDialog";

const getGreetingConfig = (hour: number) => {
  if (hour >= 5 && hour < 12)
    return {
      greeting: "Bonjour",
      Icon: Sunrise,
      timeOfDay: TimeOfDay.MORNING,
      iconColor: "text-amber-300",
    };
  if (hour >= 12 && hour < 18)
    return {
      greeting: "Bon après-midi",
      Icon: Sun,
      timeOfDay: TimeOfDay.AFTERNOON,
      iconColor: "text-yellow-300",
    };
  if (hour >= 18 && hour < 22)
    return {
      greeting: "Bonsoir",
      Icon: Moon,
      timeOfDay: TimeOfDay.EVENING,
      iconColor: "text-indigo-300",
    };
  return {
    greeting: "Bonne nuit",
    Icon: Moon,
    timeOfDay: null,
    iconColor: "text-indigo-300",
  };
};

const DayDot = ({ status }: { status: DayStatus["status"] }) => {
  const cls = {
    completed: "bg-emerald-400",
    missed: "bg-rose-400/70",
    today: "border-2 border-white/60 bg-transparent",
  }[status];
  return <div className={`h-2 w-2 rounded-full ${cls}`} />;
};

const getMotivationalMessage = (
  streak: number,
  completedCount: number,
  totalCount: number,
  hour: number,
): string => {
  if (totalCount > 0 && completedCount >= totalCount)
    return "Journée parfaite. Continue comme ça.";
  if (streak > 30) return "Un mois de régularité. C'est du sérieux.";
  if (streak > 14) return "Deux semaines sans lâcher. Belle discipline.";
  if (streak > 7) return "Belle lancée. Ne t'arrête pas là.";
  if (streak > 2) return "La régularité se construit jour après jour.";
  if (completedCount > 0) return "Bien parti. Finis sur ta lancée.";
  if (hour >= 18) return "Dernière ligne droite pour aujourd'hui.";
  if (hour >= 12) return "L'après-midi est là, profites-en.";
  if (streak === 0) return "Chaque jour est un nouveau départ.";
  return "La journée commence, c'est le bon moment.";
};

const HomeRoutineItem = ({
  routine,
  status,
  onToggle,
}: {
  routine: Routine;
  status: RoutineStatus | undefined;
  onToggle: () => void;
}) => {
  const done = status?.completed ?? false;
  const skipped = status?.skipped ?? false;

  return (
    <div
      className={`flex items-center gap-3 py-2.5 ${skipped ? "opacity-40" : ""}`}
    >
      <button
        onClick={done || skipped ? undefined : onToggle}
        disabled={skipped}
        aria-label={
          done ? `${routine.title} complétée` : `Compléter ${routine.title}`
        }
        className={`shrink-0 transition-transform active:scale-90 ${skipped ? "cursor-default" : "cursor-pointer"}`}
      >
        {done ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" aria-hidden="true" />
        ) : (
          <Circle
            className="h-5 w-5 text-muted-foreground/40 hover:text-primary transition-colors"
            aria-hidden="true"
          />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium truncate ${done ? "line-through text-muted-foreground" : ""}`}
        >
          {routine.title}
        </p>
        {routine.duration && (
          <p className="text-[10px] text-muted-foreground">
            {routine.duration} min
          </p>
        )}
      </div>
      {done && (
        <span className="text-[10px] text-green-500 font-medium shrink-0">
          ✓
        </span>
      )}
      {skipped && (
        <span className="text-[10px] text-muted-foreground shrink-0">
          Repos
        </span>
      )}
    </div>
  );
};

const Home = () => {
  usePageTitle("Accueil");
  const { user } = useAuth();
  const { currentStreak, recordStreak, lastDaysStatus, tasks, isLoading } =
    useStats();
  const { activeRoutines, statuses, toggleComplete, addRoutine } =
    useRoutines();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const firstName = user?.user_metadata?.display_name?.split(" ")[0] ?? null;
  const hour = new Date().getHours();
  const { greeting, Icon, timeOfDay, iconColor } = getGreetingConfig(hour);
  const todayDate = getTodayString();

  const todayDayOfWeek = JS_DAY_TO_DAY_OF_WEEK[new Date().getDay()];
  const todaysRoutines = useMemo(
    () => getTodaysRoutines(activeRoutines, todayDayOfWeek),
    [activeRoutines, todayDayOfWeek],
  );

  const completedCount = statuses.filter(
    (s) => s.date === todayDate && s.completed,
  ).length;
  const totalCount = todaysRoutines.length;
  const allDone = totalCount > 0 && completedCount >= totalCount;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const pendingTasksCount = useMemo(
    () => tasks.filter((t) => t.status === Status.TODO).length,
    [tasks],
  );

  const currentSlotRoutines = useMemo(() => {
    if (!timeOfDay) return [];
    return todaysRoutines.filter((r) => r.timeOfDay === timeOfDay);
  }, [todaysRoutines, timeOfDay]);

  const motivationalMessage = getMotivationalMessage(
    currentStreak,
    completedCount,
    totalCount,
    hour,
  );

  return (
    <div className="min-h-screen bg-gradient-bg pb-36 md:pb-24">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-3xl space-y-4">
        <Header />

        {/* Hero greeting */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 px-5 py-6 text-primary-foreground shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/5"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-white/5"
            aria-hidden="true"
          />

          <p className="text-xs font-medium text-primary-foreground/60 capitalize tracking-wide mb-2">
            {formatFrenchDate()}
          </p>
          <div className="relative">
            {/* Robot gauche + speech bubble droite */}
            <div className="flex items-start gap-3">
              <div className="h-20 w-20 shrink-0" aria-hidden="true">
                <Lottie animationData={robotAnimation} loop={true} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="relative rounded-2xl bg-white/15 px-4 py-3">
                  <div
                    className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 border-y-[6px] border-r-[8px] border-y-transparent border-r-white/15 w-0 h-0"
                    aria-hidden="true"
                  />
                  <h1 className="text-xl sm:text-2xl font-bold">
                    {greeting}
                    {firstName ? `, ${firstName}` : ""} 👋
                  </h1>
                  <p className="mt-0.5 text-xs text-primary-foreground/70 italic">
                    {motivationalMessage}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div className="flex items-center gap-2.5">
                <Flame
                  className={`h-7 w-7 text-orange-300 shrink-0 transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
                  aria-hidden="true"
                />
                <div
                  className={`transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
                >
                  <p className="text-3xl font-bold leading-none">
                    {currentStreak}
                  </p>
                  <p className="text-xs text-primary-foreground/70 mt-0.5">
                    {currentStreak <= 1 ? "jour de streak" : "jours de streak"}
                  </p>
                </div>
                {!isLoading && recordStreak > 0 && (
                  <span className="ml-1 text-[10px] text-primary-foreground/40 self-end mb-0.5">
                    record&nbsp;{recordStreak}j
                  </span>
                )}
              </div>

              <div className="flex flex-col items-end gap-1">
                <p className="text-[10px] text-primary-foreground/40 uppercase tracking-wider">
                  7 derniers jours
                </p>
                <div
                  className="flex items-center gap-1"
                  aria-label="Statut des 7 derniers jours"
                >
                  {lastDaysStatus.map((day) => (
                    <DayDot key={day.date} status={day.status} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress card */}
        {!isLoading && totalCount > 0 && (
          <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Aujourd'hui</p>
              {allDone ? (
                <span className="flex items-center gap-1 text-xs font-medium text-green-500">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Tout bouclé !
                </span>
              ) : (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {completedCount} / {totalCount}
                </span>
              )}
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progressPercent}%`,
                  background: allDone
                    ? "hsl(var(--success))"
                    : "var(--gradient-primary)",
                }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${completedCount} sur ${totalCount} routines complétées`}
              />
            </div>
            {!allDone && (
              <p className="mt-2 text-xs text-muted-foreground">
                {totalCount - completedCount}&nbsp;
                {totalCount - completedCount > 1 ? "restantes" : "restante"}
              </p>
            )}
          </div>
        )}

        {/* All done celebration */}
        {!isLoading && allDone && (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 px-5 py-5 text-center animate-in fade-in zoom-in-95 duration-500">
            <p className="text-3xl mb-2" aria-hidden="true">
              🎉
            </p>
            <p className="font-semibold text-sm text-green-600 dark:text-green-400">
              Journée bouclée !
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Reviens demain pour continuer.
            </p>
          </div>
        )}

        {/* Current slot routines */}
        {!isLoading && currentSlotRoutines.length > 0 && !allDone && (
          <div className="rounded-2xl border border-border bg-card px-5 py-3 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                À faire maintenant
              </p>
              <Icon className={`h-3.5 w-3.5 ${iconColor}`} aria-hidden="true" />
            </div>
            <div className="divide-y divide-border/50">
              {currentSlotRoutines.map((routine) => {
                const status = statuses.find(
                  (s) => s.routineId === routine.id && s.date === todayDate,
                );
                return (
                  <HomeRoutineItem
                    key={routine.id}
                    routine={routine}
                    status={status}
                    onToggle={() => toggleComplete.mutate(routine.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && todaysRoutines.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card px-5 py-8 text-center animate-in fade-in duration-500">
            <Coffee
              className="h-8 w-8 text-muted-foreground/40"
              aria-hidden="true"
            />
            <p className="text-sm font-medium">
              Aucune routine pour aujourd'hui
            </p>
            <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Créer ma première routine
            </Button>
          </div>
        )}

        {/* Tasks pending */}
        {!isLoading && pendingTasksCount > 0 && (
          <Link
            to="/tasks"
            className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 shadow-sm hover:bg-muted/40 active:scale-[0.98] transition-all animate-in fade-in slide-in-from-bottom-2 duration-500 delay-125"
          >
            <div className="flex items-center gap-3">
              <ClipboardList
                className="h-5 w-5 text-muted-foreground shrink-0"
                aria-hidden="true"
              />
              <span className="text-sm font-medium">
                {pendingTasksCount}&nbsp;
                {pendingTasksCount > 1
                  ? "tâches en attente"
                  : "tâche en attente"}
              </span>
            </div>
            <ArrowRight
              className="h-4 w-4 text-muted-foreground shrink-0"
              aria-hidden="true"
            />
          </Link>
        )}

        {/* CTA to routines */}
        <Link
          to="/routines"
          className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 shadow-sm hover:bg-muted/40 active:scale-[0.98] transition-all animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150"
        >
          <div className="flex items-center gap-3">
            <Sparkles
              className="h-5 w-5 text-primary shrink-0"
              aria-hidden="true"
            />
            <span className="text-sm font-medium">Toutes mes routines</span>
          </div>
          <ArrowRight
            className="h-4 w-4 text-muted-foreground shrink-0"
            aria-hidden="true"
          />
        </Link>
      </div>

      <CreateRoutineDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateRoutine={(data) => addRoutine.mutate(data)}
      />

      <Navigation />
    </div>
  );
};

export default Home;
