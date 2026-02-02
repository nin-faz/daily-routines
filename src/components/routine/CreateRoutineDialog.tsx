import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Bell, Sunrise, Sun, Moon } from "lucide-react";
import { Routine, TimeOfDay } from "@/types/routine";
import { toast } from "sonner";
import { requestNotificationPermission } from "@/lib/notifications";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CreateRoutineDialogProps {
  routine?: Routine;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreateRoutine?: (routine: Omit<Routine, "id" | "createdAt">) => void;
  onUpdateRoutine?: (routine: Routine) => void;
}

const CreateRoutineDialog = ({
  routine,
  open: controlledOpen,
  onOpenChange,
  onCreateRoutine,
  onUpdateRoutine,
}: CreateRoutineDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState<string>("");
  const [notificationTime, setNotificationTime] = useState<string>("");
  const [enableNotification, setEnableNotification] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | undefined>(undefined);

  const isEditMode = !!routine;
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    if (routine && open) {
      setTitle(routine.title);
      setDuration(routine.duration ? routine.duration.toString() : "");
      setNotificationTime(routine.notificationTime || "");
      setEnableNotification(!!routine.notificationTime);
      setTimeOfDay(routine.timeOfDay);
    } else if (!open) {
      // Reset form when closing
      setTitle("");
      setDuration("");
      setNotificationTime("");
      setEnableNotification(false);
      setTimeOfDay(undefined);
    }
  }, [routine, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    const durationNum = duration ? parseInt(duration) : undefined;

    if (duration && (!durationNum || durationNum <= 0)) {
      toast.error("La durée doit être un nombre positif");
      return;
    }

    if (enableNotification && notificationTime) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        toast.error("Permission de notification refusée");
        return;
      }
    }

    if (isEditMode && onUpdateRoutine && routine) {
      onUpdateRoutine({
        ...routine,
        title: title.trim(),
        duration: durationNum,
        hasTimer: !!durationNum,
        notificationTime:
          enableNotification && notificationTime ? notificationTime : undefined,
        timeOfDay,
      });
      toast.success("Routine modifiée avec succès");
    } else if (onCreateRoutine) {
      onCreateRoutine({
        title: title.trim(),
        duration: durationNum,
        hasTimer: !!durationNum,
        notificationTime:
          enableNotification && notificationTime ? notificationTime : undefined,
        timeOfDay,
      });
      toast.success("Routine créée avec succès");
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditMode && (
        <DialogTrigger asChild>
          <div className="fixed bottom-20 right-4 z-50 group">
            <Button
              size="lg"
              className="rounded-full h-12 w-12 shadow-xl bg-gradient-primary hover:opacity-90 transition-all hover:scale-105 relative"
            >
              <Plus className="h-5 w-5" />
            </Button>
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full" />
            <span className="absolute -top-10 right-0 bg-popover text-popover-foreground px-3 py-1.5 rounded-lg text-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Nouvelle routine
            </span>
          </div>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifier la routine" : "Créer une routine"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la routine</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Sport, Méditation..."
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Durée (minutes, optionnel)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
            />
          </div>

          <div className="space-y-3">
            <Label>Moment de la journée (optionnel)</Label>
            <RadioGroup
              value={timeOfDay || ""}
              onValueChange={(value) =>
                setTimeOfDay(value === "" ? undefined : (value as TimeOfDay))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={TimeOfDay.Morning} id="morning" />
                <Label
                  htmlFor="morning"
                  className="cursor-pointer flex items-center gap-2 font-normal"
                >
                  <Sunrise className="h-4 w-4 text-amber-500" />
                  Matin
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={TimeOfDay.Afternoon} id="afternoon" />
                <Label
                  htmlFor="afternoon"
                  className="cursor-pointer flex items-center gap-2 font-normal"
                >
                  <Sun className="h-4 w-4 text-orange-500" />
                  Après-midi
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={TimeOfDay.Evening} id="evening" />
                <Label
                  htmlFor="evening"
                  className="cursor-pointer flex items-center gap-2 font-normal"
                >
                  <Moon className="h-4 w-4 text-indigo-500" />
                  Soir
                </Label>
              </div>
            </RadioGroup>
            {timeOfDay && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTimeOfDay(undefined)}
                className="text-xs"
              >
                Retirer le tag
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="notification" className="cursor-pointer">
                Notification quotidienne
              </Label>
            </div>
            <Switch
              id="notification"
              checked={enableNotification}
              onCheckedChange={setEnableNotification}
            />
          </div>

          {enableNotification && (
            <div className="space-y-2">
              <Label htmlFor="notificationTime">Heure de la notification</Label>
              <Input
                id="notificationTime"
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-primary">
              {isEditMode ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoutineDialog;
