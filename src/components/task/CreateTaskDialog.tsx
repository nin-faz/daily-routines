import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, CalendarIcon } from "lucide-react";
import { Task } from "@/types/task";
import { Folder } from "@/types/folder";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatDateYMD } from "@/lib/date";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CreateTaskDialogProps {
  folders: Folder[];
  defaultFolderId?: string;
  task?: Task;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreateTask?: (
    task: Omit<Task, "id" | "createdAt" | "userId" | "updatedAt" | "status">,
  ) => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  trigger?: React.ReactNode;
}

const CreateTaskDialog = ({
  folders,
  defaultFolderId,
  task,
  open: controlledOpen,
  onOpenChange,
  onCreateTask,
  onUpdateTask,
  trigger,
}: CreateTaskDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState<string | undefined>(defaultFolderId);
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const isEditMode = !!task;
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setDescription(task.description || "");
      setFolderId(task.folderId);
      setDeadline(
        task.deadline ? new Date(task.deadline + "T00:00:00") : undefined,
      );
    } else if (!open) {
      setTitle("");
      setDescription("");
      setFolderId(defaultFolderId);
      setDeadline(undefined);
    }
  }, [task, open, defaultFolderId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    if (isEditMode && onUpdateTask && task) {
      onUpdateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        folderId: folderId || undefined,
        deadline: deadline ? formatDateYMD(deadline) : undefined,
      });
      toast.success("Tâche modifiée avec succès");
    } else if (onCreateTask) {
      onCreateTask({
        title: title.trim(),
        description: description.trim() || undefined,
        folderId: folderId || undefined,
        deadline: deadline ? formatDateYMD(deadline) : undefined,
      });
      toast.success("Tâche créée avec succès");
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditMode && (
        <DialogTrigger asChild>
          {trigger || (
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle tâche
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifier la tâche" : "Nouvelle tâche"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="after:content-['*'] after:ml-0.5">
              Titre
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Que devez-vous faire ?"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails supplémentaires..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folderId">Dossier</Label>
            <Select
              value={folderId || "none"}
              onValueChange={(v) => setFolderId(v === "none" ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Aucun dossier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun dossier</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Date limite</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline
                    ? format(deadline, "PPP", { locale: fr })
                    : "Choisir une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={(d) => {
                    // Fermer le calendrier, une fois la date sélectionnée
                    if (!d) return;
                    const date = Array.isArray(d) ? d[0] : d;
                    setDeadline(date as Date);
                    setDatePickerOpen(false);
                  }}
                  disabled={{ before: new Date() }}
                  locale={fr}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {deadline && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeadline(undefined)}
                className="text-xs text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive w-fit mt-1"
                tabIndex={0}
                title="Supprimer la date limite"
              >
                <span>Supprimer la date</span>
              </Button>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 bg-gradient-primary"
            >
              {isEditMode ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
