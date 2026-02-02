import { useState } from "react";
import { ProjectTask } from "@/types/project";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EditTaskDialogProps {
  task: ProjectTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<ProjectTask>) => void;
}

const EditTaskDialog = ({
  task,
  open,
  onOpenChange,
  onSave,
}: EditTaskDialogProps) => {
  const [title, setTitle] = useState(task.title);
  const [deadline, setDeadline] = useState<Date | undefined>(
    task.deadline ? parseISO(task.deadline) : undefined,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(task.id, {
      title: title.trim(),
      deadline: deadline ? format(deadline, "yyyy-MM-dd") : undefined,
    });
    onOpenChange(false);
  };

  const clearDeadline = () => {
    setDeadline(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Modifier la tâche</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-task-title">Titre</Label>
            <Input
              id="edit-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ma tâche"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Deadline (optionnelle)</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !deadline && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline
                      ? format(deadline, "d MMMM yyyy", { locale: fr })
                      : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    locale={fr}
                    initialFocus
                    className="pointer-events-auto"
                    disabled={{ before: new Date() }}
                  />
                </PopoverContent>
              </Popover>
              {deadline && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={clearDeadline}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <Button type="submit" className="w-full">
            Enregistrer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;
