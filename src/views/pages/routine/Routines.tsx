import { useState, useEffect } from "react";
import { Routine, TimeOfDay, RoutineFrequency } from "@/shared/types/routine";
import {
  JS_DAY_TO_DAY_OF_WEEK,
  getTimeOfDayLabel,
  getTodaysRoutines,
  groupByTimeOfDay,
} from "@/shared/lib/days";
import { formatFrenchDate } from "@/shared/lib/date";
import { getTodayString } from "@/shared/lib/date";
import RoutineCard from "@/views/components/routine/RoutineCard";
import CreateRoutineDialog from "@/views/components/routine/CreateRoutineDialog";
import {
  Sparkles,
  Sunrise,
  Sun,
  Moon,
  Coffee,
  CalendarDays,
  Repeat,
} from "lucide-react";
import Navigation from "@/application/components/layout/Navigation";
import { Link } from "react-router-dom";
import Header from "@/application/components/layout/Header";
import { requestNotificationPermission } from "@/application/services/notifications";
import { RoutineListSkeleton } from "@/views/components/routine/RoutineSkeleton";
import EmptyState from "@/shared/components/EmptyState";
import OnboardingDialog from "@/shared/components/OnboardingDialog";
import { useRoutines } from "@/application/hooks/useRoutines";

const Routines = () => {
  const {
    activeRoutines,
    statuses,
    isLoading,
    addRoutine,
    toggleComplete,
    skipToday,
    updateRoutine,
    deleteRoutine,
  } = useRoutines();

  // Stocke la date du jour au format AAAA-MM-JJ
  const [todayDate, setTodayDate] = useState(getTodayString());
  // Routine en cours d'édition (pour le formulaire de modification)
  const [editingRoutine, setEditingRoutine] = useState<Routine | undefined>(
    undefined,
  );
  // Contrôle l'ouverture du dialogue d'édition
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Au montage du composant : demande la permission de notification et met à jour la date du jour
  useEffect(() => {
    requestNotificationPermission();
    setTodayDate(getTodayString());
  }, []);

  // Ajoute une nouvelle routine (appelé lors de la soumission du formulaire de création)
  const handleCreateRoutine = (
    routineData: Omit<Routine, "id" | "createdAt" | "userId" | "updatedAt">,
  ) => {
    addRoutine.mutate(routineData);
  };

  // Marque une routine comme complétée ou annule la complétion (cocher/décocher)
  const handleToggleComplete = (routineId: string) => {
    toggleComplete.mutate(routineId);
  };

  // Marque une routine comme "sautée" pour aujourd'hui (ou annule le saut)
  const handleSkipToday = (routineId: string) => {
    skipToday.mutate(routineId);
  };

  // Prépare l'édition d'une routine (ouvre le formulaire de modification)
  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setEditDialogOpen(true);
  };

  // Met à jour une routine existante (appelé lors de la soumission du formulaire d'édition)
  const handleUpdateRoutine = (id: string, updates: Partial<Routine>) => {
    updateRoutine.mutate(
      { id, updates },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setEditingRoutine(undefined);
        },
      },
    );
  };

  const handleDeleteRoutine = (routineId: string) => {
    deleteRoutine.mutate(routineId);
  };

  const handleArchiveRoutine = (routine: Routine) => {
    updateRoutine.mutate({
      id: routine.id,
      updates: { isArchived: !routine.isArchived },
    });
  };

  // Stocke le nombre de routines complétées aujourd'hui
  const [completedCount, setCompletedCount] = useState(0);

  // Met à jour le nombre de routines complétées à chaque changement de statuts ou de date
  useEffect(() => {
    const count = statuses.filter(
      (s) => s.date === todayDate && s.completed,
    ).length;
    setCompletedCount(count);
  }, [statuses, todayDate]);

  const todayDayOfWeek = JS_DAY_TO_DAY_OF_WEEK[new Date().getDay()];
  const todaysRoutines = getTodaysRoutines(
    [...activeRoutines].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    ),
    todayDayOfWeek,
  );

  // Séparer les routines par fréquence (quotidiennes vs hebdomadaires)
  const dailyRoutines = todaysRoutines.filter(
    (r) => !r.frequency || r.frequency === RoutineFrequency.DAILY,
  );
  const weeklyRoutines = todaysRoutines.filter(
    (r) => r.frequency === RoutineFrequency.WEEKLY,
  );

  // Fonction helper pour rendre un groupe de routines groupées par moment de la journée
  const renderRoutineGroup = (routinesList: Routine[]) => {
    const grouped = groupByTimeOfDay(routinesList);
    const sections = [
      {
        id: TimeOfDay.MORNING,
        ...getTimeOfDayLabel(TimeOfDay.MORNING),
        icon: Sunrise,
        data: grouped[TimeOfDay.MORNING],
      },
      {
        id: TimeOfDay.AFTERNOON,
        ...getTimeOfDayLabel(TimeOfDay.AFTERNOON),
        icon: Sun,
        data: grouped[TimeOfDay.AFTERNOON],
      },
      {
        id: TimeOfDay.EVENING,
        ...getTimeOfDayLabel(TimeOfDay.EVENING),
        icon: Moon,
        data: grouped[TimeOfDay.EVENING],
      },
      {
        id: "untagged",
        label: "À votre rythme",
        icon: Sparkles,
        color: "text-indigo-400",
        data: grouped.untagged,
      },
    ];

    return (
      <div className="space-y-8">
        {/* Plus d'espace entre les grands groupes */}
        {sections.filter(Boolean).map((section) => {
          if (section.data.length === 0) return null;

          const { icon: Icon, label, color, data } = section;

          return (
            <section
              key={section.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              {/* Header de section plus stylisé */}
              <div className="flex items-center gap-3 mb-4 px-1">
                <div
                  className={`p-2 rounded-xl bg-background shadow-sm border ${color.replace("text-", "text-")}`}
                >
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">
                    {label}
                  </h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                    {data.length} {data.length > 1 ? "routines" : "routine"}
                  </p>
                </div>
                <div className="flex-1 border-b border-dashed ml-2 opacity-20" />
              </div>

              {/* Grille de routines */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {data.map((routine) => {
                  const status = statuses.find(
                    (s) => s.routineId === routine.id && s.date === todayDate,
                  );
                  return (
                    <RoutineCard
                      key={routine.id}
                      routine={routine}
                      status={status}
                      onToggleComplete={() => handleToggleComplete(routine.id)}
                      onSkipToday={() => handleSkipToday(routine.id)}
                      onEdit={() => handleEditRoutine(routine)}
                      onDelete={() => handleDeleteRoutine(routine.id)}
                      onArchive={() => handleArchiveRoutine(routine)}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-bg pb-36 md:pb-24">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-3xl">
        <header className="mb-6 sm:mb-8">
          <Header />
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Mes Routines
            </h1>
          </div>
          <div className="text-center">
            <p className="text-sm sm:text-base text-muted-foreground capitalize">
              {formatFrenchDate()}
            </p>
            <div className="mt-2">
              <Link
                to="/routines/all"
                className="text-xs text-primary hover:underline"
              >
                Voir toutes les routines
              </Link>
            </div>
            {activeRoutines.length > 0 && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {completedCount} / {todaysRoutines.length} complétées
                aujourd'hui
              </p>
            )}
          </div>
        </header>
        <main className="space-y-6">
          {isLoading ? (
            <RoutineListSkeleton />
          ) : activeRoutines.length === 0 ? (
            <EmptyState
              icon={Coffee}
              title="Aucune routine"
              description="Commencez par créer votre première routine quotidienne pour développer de bonnes habitudes !"
            />
          ) : (
            <>
              {/* Section Routines Quotidiennes */}
              {dailyRoutines.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-6 w-6 text-primary" />
                    <h2 className="text-lg font-semibold">Quotidiennes</h2>
                  </div>
                  <div className="space-y-4 pl-2">
                    {renderRoutineGroup(dailyRoutines)}
                  </div>
                </div>
              )}

              {/* Section Routines Hebdomadaires */}
              {weeklyRoutines.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-6 w-6 text-primary" />
                    <h2 className="text-lg font-semibold">Hebdomadaires</h2>
                  </div>
                  <div className="space-y-4 pl-2">
                    {renderRoutineGroup(weeklyRoutines)}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
        <OnboardingDialog />
        <CreateRoutineDialog onCreateRoutine={handleCreateRoutine} />

        {editingRoutine && (
          <CreateRoutineDialog
            routine={editingRoutine}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onUpdateRoutine={handleUpdateRoutine}
          />
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default Routines;
