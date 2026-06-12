import { useRoutines } from "@/application/hooks/useRoutines";
import RoutineCard from "@/views/components/routine/RoutineCard";
import Navigation from "@/application/components/layout/Navigation";
import EmptyState from "@/shared/components/EmptyState";
import { Archive, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { usePageTitle } from "@/application/hooks/usePageTitle";

const ArchivePage = () => {
  usePageTitle("Routines archivées");
  const { archivedRoutines, statuses, isLoading, deleteRoutine } =
    useRoutines();

  const navigate = useNavigate();

  // Handler pour suppression
  const handleDelete = (routineId: string) => {
    deleteRoutine.mutate(routineId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <header>
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
            <div className="flex justify-center items-center gap-2 ">
              <Archive className="h-6 w-6 sm:h-8 sm:w-8 text-primary" aria-hidden="true" />
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Routines archivées
              </h1>
            </div>
          </div>
        </header>

        <hr className="border-border w-full mb-6" />

        <main className="space-y-6">
          {isLoading ? (
            <p>Chargement...</p>
          ) : archivedRoutines.length === 0 ? (
            <EmptyState
              icon={Archive}
              title="Aucune routine archivée"
              description="Vous n'avez archivé aucune routine pour le moment."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {archivedRoutines.map((routine) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  status={statuses.find((s) => s.routineId === routine.id)}
                  onToggleComplete={() => {}}
                  onSkipToday={() => {}}
                  onEdit={() => {}}
                  onDelete={() => handleDelete(routine.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
      <Navigation />
    </div>
  );
};

export default ArchivePage;
