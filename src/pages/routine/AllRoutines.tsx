import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Navigation from "@/components/layout/Navigation";
import { Button } from "@/components/ui/button";
import CreateRoutineDialog from "@/components/routine/CreateRoutineDialog";
import RoutineCard from "@/components/routine/RoutineCard";
import { useRoutines } from "@/hooks/useRoutines";
import { getTodayString } from "@/integrations/supabase/routines";
import { ArrowLeft } from "lucide-react";

const AllRoutines = () => {
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
  const [editingRoutine, setEditingRoutine] = useState<any | undefined>(
    undefined,
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleEdit = (r: any) => {
    setEditingRoutine(r);
    setEditDialogOpen(true);
  };

  const handleCreate = (data: any) => addRoutine.mutate(data);
  const handleUpdate = (id: string, updates: any) =>
    updateRoutine.mutate(
      { id, updates },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setEditingRoutine(undefined);
        },
      },
    );

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-bg pb-36 md:pb-24">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <Header />
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-start gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Retour à l'accueil"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
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
            <CreateRoutineDialog onCreateRoutine={handleCreate} />
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <p>Chargement…</p>
          ) : routines.length === 0 ? (
            <p className="text-muted-foreground">Aucune routine trouvée</p>
          ) : (
            routines.map((r: any) => {
              const today = getTodayString();
              const status = statuses.find(
                (s: any) => s.routineId === r.id && s.date === today,
              );

              return (
                <RoutineCard
                  key={r.id}
                  routine={r}
                  status={status}
                  onToggleComplete={() => toggleComplete.mutate(r.id)}
                  onSkipToday={() => skipToday.mutate(r.id)}
                  onEdit={() => handleEdit(r)}
                  onDelete={() => deleteRoutine.mutate(r.id)}
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
        onUpdateRoutine={handleUpdate}
      />

      <Navigation />
    </div>
  );
};

export default AllRoutines;
