import { useState, useEffect } from "react";
import { Routine, TimeOfDay } from "@/types/routine";
import { getTodayString } from "@/integrations/supabase/routines";
import RoutineCard from "@/components/routine/RoutineCard";
import CreateRoutineDialog from "@/components/routine/CreateRoutineDialog";
import { Sparkles, Sunrise, Sun, Moon, Coffee } from "lucide-react";
import Navigation from "@/components/layout/Navigation";
import Header from "@/components/layout/Header";
import { requestNotificationPermission } from "@/lib/notifications";
import { RoutineListSkeleton } from "@/components/routine/RoutineSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import OnboardingDialog from "@/components/shared/OnboardingDialog";
import { useRoutines } from "@/hooks/useRoutines";

const Routines = () => {
  const {
    routines,
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
    routineData: Omit<Routine, "id" | "createdAt">,
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
  const handleUpdateRoutine = (updatedRoutine: Routine) => {
    updateRoutine.mutate(
      { id: updatedRoutine.id, data: updatedRoutine },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setEditingRoutine(undefined);
        },
      },
    );
  };

  // Supprime une routine
  const handleDeleteRoutine = (routineId: string) => {
    deleteRoutine.mutate(routineId);
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

  // Formate la date du jour pour l'affichage (ex: "jeudi 23 janvier 2026")
  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Retourne les infos d'affichage (icône, label, couleur) selon le moment de la journée
  const getTimeOfDayLabel = (timeOfDay: TimeOfDay) => {
    const labels = {
      [TimeOfDay.Morning]: {
        icon: Sunrise,
        label: "Matin",
        color: "text-amber-500",
      },
      [TimeOfDay.Afternoon]: {
        icon: Sun,
        label: "Après-midi",
        color: "text-orange-500",
      },
      [TimeOfDay.Evening]: {
        icon: Moon,
        label: "Soir",
        color: "text-indigo-500",
      },
    };
    return labels[timeOfDay];
  };

  // Regroupe les routines par moment de la journée (matin, après-midi, soir, ou non taguée)
  const groupedRoutines = {
    [TimeOfDay.Morning]: routines.filter(
      (r) => r.timeOfDay === TimeOfDay.Morning,
    ),
    [TimeOfDay.Afternoon]: routines.filter(
      (r) => r.timeOfDay === TimeOfDay.Afternoon,
    ),
    [TimeOfDay.Evening]: routines.filter(
      (r) => r.timeOfDay === TimeOfDay.Evening,
    ),
    untagged: routines.filter((r) => !r.timeOfDay),
  };

  return (
    <div className="min-h-screen bg-gradient-bg pb-20 md:pb-24">
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
              {formatDate()}
            </p>
            {routines.length > 0 && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {completedCount} / {routines.length} complétées
              </p>
            )}
          </div>
        </header>
        <main className="space-y-6">
          {isLoading ? (
            <RoutineListSkeleton />
          ) : routines.length === 0 ? (
            <EmptyState
              icon={Coffee}
              title="Aucune routine"
              description="Commencez par créer votre première routine quotidienne pour développer de bonnes habitudes !"
            />
          ) : (
            <>
              {[TimeOfDay.Morning, TimeOfDay.Afternoon, TimeOfDay.Evening].map(
                (timeOfDay) => {
                  const routinesForTime = groupedRoutines[timeOfDay];
                  if (routinesForTime.length === 0) return null;

                  const {
                    icon: Icon,
                    label,
                    color,
                  } = getTimeOfDayLabel(timeOfDay);

                  return (
                    <div key={timeOfDay} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${color}`} />
                        <h2 className="text-lg font-semibold">{label}</h2>
                      </div>
                      <div className="space-y-3">
                        {routinesForTime.map((routine) => {
                          const status = statuses.find(
                            (s) =>
                              s.routineId === routine.id &&
                              s.date === todayDate,
                          );
                          return (
                            <RoutineCard
                              key={routine.id}
                              routine={routine}
                              status={status}
                              onToggleComplete={() =>
                                handleToggleComplete(routine.id)
                              }
                              onSkipToday={() => handleSkipToday(routine.id)}
                              onEdit={() => handleEditRoutine(routine)}
                              onDelete={() => handleDeleteRoutine(routine.id)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                },
              )}

              {groupedRoutines.untagged.length > 0 && (
                <div className="space-y-3">
                  {(groupedRoutines.morning.length > 0 ||
                    groupedRoutines.afternoon.length > 0 ||
                    groupedRoutines.evening.length > 0) && (
                    <h2 className="text-lg font-semibold text-muted-foreground">
                      Autres
                    </h2>
                  )}
                  <div className="space-y-3">
                    {groupedRoutines.untagged.map((routine) => {
                      const status = statuses.find(
                        (s) =>
                          s.routineId === routine.id && s.date === todayDate,
                      );
                      return (
                        <RoutineCard
                          key={routine.id}
                          routine={routine}
                          status={status}
                          onToggleComplete={() =>
                            handleToggleComplete(routine.id)
                          }
                          onSkipToday={() => handleSkipToday(routine.id)}
                          onEdit={() => handleEditRoutine(routine)}
                          onDelete={() => handleDeleteRoutine(routine.id)}
                        />
                      );
                    })}
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
