import {
  Routine,
  RoutineStatus,
  RoutineFrequency,
} from "@/shared/types/routine";
import { Card } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import ConfirmDeleteButton from "@/shared/components/ui/ConfirmDeleteButton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/shared/components/ui/dropdown-menu";
import {
  TrendingUp,
  CalendarX,
  Pencil,
  Calendar,
  MoreVertical,
} from "lucide-react";
import Timer from "./Timer";
import { cn } from "@/shared/lib/utils";
import { useNavigate } from "react-router-dom";

import { getDayLabel } from "@/shared/lib/days";
import ConfirmArchiveButton from "@/shared/components/ui/ConfirmArchiveButton";

interface RoutineCardProps {
  routine: Routine;
  status?: RoutineStatus;
  onToggleComplete: () => void;
  onSkipToday: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onArchive?: () => void;
}

const RoutineCard = ({
  routine,
  status,
  onToggleComplete,
  onSkipToday,
  onEdit,
  onDelete,
  onArchive,
}: RoutineCardProps) => {
  const isCompleted = status?.completed || false;
  const isSkipped = status?.skipped || false;
  const navigate = useNavigate();

  const isWeekly =
    routine.frequency === RoutineFrequency.WEEKLY &&
    routine.weekDays &&
    routine.weekDays.length > 0;

  return (
    <Card
      className={cn(
        "p-3 sm:p-4 shadow-card hover:border-primary/30",
        isCompleted && "opacity-60",
        isSkipped && "opacity-50 border-muted",
      )}
    >
      <div className="flex flex-col gap-2">
        {/* SECTION GAUCHE : Action & Info */}
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={onToggleComplete}
              disabled={isSkipped}
              className="flex-shrink-0"
              aria-label={`Marquer "${routine.title}" comme complétée`}
            />

            <button
              className="flex-1 min-w-0 text-left"
              onClick={() => navigate(`/routine/${routine.id}`)}
              aria-label={`Voir les détails de "${routine.title}"`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={cn(
                    "text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors",
                    isSkipped && "text-muted-foreground",
                  )}
                >
                  {routine.title}
                </h3>
                {isSkipped && (
                  <Badge variant="secondary" className="text-xs py-0 h-5">
                    Sautée aujourd'hui
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 sm:mt-1 flex-wrap">
                {isWeekly && (
                  <Badge
                    variant="outline"
                    className="text-xs gap-1 py-0 h-5 border-primary/30 text-primary"
                  >
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    {routine
                      .weekDays!.map((day: string) => getDayLabel(day))
                      .join(", ")}
                  </Badge>
                )}
              </div>
            </button>
          </div>

          {/* SECTION DROITE : Timer & Actions */}
          <div className="flex flex-col gap-2">
            <div
              className={`flex items-center gap-1 p-1 ${!routine.isArchived ? "bg-muted/30 rounded-lg border border-muted/50 shadow-sm" : ""}`}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/routine/${routine.id}`)}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-background/50"
                aria-label={`Voir les statistiques de "${routine.title}"`}
              >
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
              </Button>

              {!routine.isArchived ? (
                <>
                  <div className="w-px h-4 bg-muted mx-0.5" />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSkipToday}
                    disabled={isCompleted}
                    className={cn(
                      "h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-background/50",
                      isSkipped && "text-primary bg-background shadow-sm",
                    )}
                    aria-label={isSkipped ? `Annuler le saut de "${routine.title}"` : `Sauter "${routine.title}" aujourd'hui`}
                  >
                    <CalendarX className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                  </Button>

                  <div className="w-px h-4 bg-muted mx-0.5" />

                  {/* Menu contextuel pour les actions secondaires */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                      >
                        <MoreVertical className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Options de {routine.title}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          onEdit();
                        }}
                        className="flex justify-center items-center cursor-pointer"
                      >
                        <Pencil className="mr-2 h-4 w-4" aria-hidden="true" /> Modifier la routine
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {typeof onArchive === "function" && (
                        <DropdownMenuItem asChild>
                          <ConfirmArchiveButton
                            onConfirm={onArchive}
                            description={`L’archivage est irréversible. Vous ne pourrez plus restaurer "${routine.title}".`}
                            buttonClassName="flex gap-2 w-full text-orange-600 h-8"
                          />
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem asChild>
                        <ConfirmDeleteButton
                          onConfirm={onDelete}
                          label="Supprimer la routine ?"
                          description={`Cette action supprimera définitivement "${routine.title}".`}
                          buttonClassName="flex gap-2 w-full text-destructive h-8"
                          labelView="Supprimer la routine"
                        />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-px h-4 bg-muted mx-0.5" />

                  <ConfirmDeleteButton
                    onConfirm={onDelete}
                    label="Supprimer la routine ?"
                    description={`Cette action supprimera définitivement "${routine.title}".`}
                    buttonClassName="h-8 w-auto text-destructive !p-2"
                    actionLabel="Supprimer"
                    labelView={routine.isArchived ? "" : "Supprimer la routine"}
                  />
                </div>
              )}
            </div>
            {routine.hasTimer &&
              routine.duration &&
              !isSkipped &&
              !isCompleted && (
                <div className="flex ">
                  <Timer duration={routine.duration} routineId={routine.id} />
                </div>
              )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RoutineCard;
