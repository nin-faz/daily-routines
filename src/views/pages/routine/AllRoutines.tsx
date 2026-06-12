import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/application/components/layout/Header";
import Navigation from "@/application/components/layout/Navigation";
import { Button } from "@/shared/components/ui/button";
import CreateRoutineDialog from "@/views/components/routine/CreateRoutineDialog";
import RoutineCard from "@/views/components/routine/RoutineCard";
import { useRoutines } from "@/application/hooks/useRoutines";
import { getTodayString } from "@/shared/lib/date";
import { ArrowLeft } from "lucide-react";
import { Routine } from "@/shared/types/routine";
import { usePageTitle } from "@/application/hooks/usePageTitle";

const AllRoutines = () => {
  usePageTitle("Toutes les routines");
  const {
    routines,
    statuses,
    isLoading,
    addRoutine,
    updateRoutine,
    deleteRoutine,
  } = useRoutines();
  const [editingRoutine, setEditingRoutine] = useState<Routine | undefined>(
    undefined,
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleCreateRoutine = (
    routineData: Omit<Routine, "id" | "createdAt" | "userId" | "updatedAt">,
  ) => {
    addRoutine.mutate(routineData);
  };

  const handleEdit = (routine: Routine) => {
    setEditingRoutine(routine);
    setEditDialogOpen(true);
  };

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

  const handleArchiveRoutine = (routine: Routine) => {
    updateRoutine.mutate({
      id: routine.id,
      updates: { isArchived: true },
    });
  };

  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-gradient-bg pb-36 md:pb-24">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <Header />
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-start gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Retour à l'accueil"
            >
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Retour
            </Button>
          </div>
        </div>

        <hr className="border-border w-full mb-6" />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Toutes les routines</h1>
            <p className="text-sm text-muted-foreground">
              Gérez et modifiez vos routines existantes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CreateRoutineDialog onCreateRoutine={handleCreateRoutine} />
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <p>Chargement…</p>
          ) : routines.length === 0 ? (
            <p className="text-muted-foreground">Aucune routine trouvée</p>
          ) : (
            routines.map((r) => {
              const today = getTodayString();
              const status = statuses.find(
                (s) => s.routineId === r.id && s.date === today,
              );

              return (
                <RoutineCard
                  key={r.id}
                  routine={r}
                  status={status}
                  // Désactivé dans AllRoutines
                  onToggleComplete={() => {}}
                  onSkipToday={() => {}}
                  onEdit={() => handleEdit(r)}
                  onDelete={() => deleteRoutine.mutate(r.id)}
                  onArchive={() => handleArchiveRoutine(r)}
                />
              );
            })
          )}
        </div>
      </div>

      <CreateRoutineDialog
        routine={editingRoutine}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdateRoutine={handleUpdateRoutine}
      />

      <Navigation />
    </main>
  );
};

export default AllRoutines;
