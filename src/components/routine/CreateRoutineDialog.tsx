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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Bell, Sunrise, Sun, Moon } from "lucide-react";
import {
  Routine,
  TimeOfDay,
  RoutineFrequency,
  DayOfWeek,
} from "@/types/routine";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNotifications } from "@/context/NotificationContext";
import { cn } from "@/lib/utils";

// Générer les options pour les heures (00-23)
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);
// Les 4 créneaux imposés
const MINUTES = ["00", "15", "30", "45"];

// Jours de la semaine
const DAYS_OF_WEEK: { value: DayOfWeek; label: string; short: string }[] = [
  { value: DayOfWeek.MONDAY, label: "Lundi", short: "L" },
  { value: DayOfWeek.TUESDAY, label: "Mardi", short: "M" },
  { value: DayOfWeek.WEDNESDAY, label: "Mercredi", short: "Me" },
  { value: DayOfWeek.THURSDAY, label: "Jeudi", short: "J" },
  { value: DayOfWeek.FRIDAY, label: "Vendredi", short: "V" },
  { value: DayOfWeek.SATURDAY, label: "Samedi", short: "S" },
  { value: DayOfWeek.SUNDAY, label: "Dimanche", short: "D" },
];

/**
 * Convertir l'heure locale en UTC pour stockage en base
 * Exemple: "08:15" à Paris (UTC+1) → "07:15" UTC
 */
const convertToUTC = (localTime: string): string => {
  const [hours, minutes] = localTime.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString().substring(11, 16);
};

/**
 * Convertir l'heure UTC en heure locale pour affichage
 * Exemple: "07:15" UTC → "08:15" à Paris (UTC+1)
 */
const convertToLocal = (utcTime: string): string => {
  const [hours, minutes] = utcTime.split(":").map(Number);
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
};

interface CreateRoutineDialogProps {
  routine?: Routine;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreateRoutine?: (
    routine: Omit<Routine, "id" | "createdAt" | "userId" | "updatedAt">,
  ) => void;
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
  const [durationHours, setDurationHours] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [selectedHour, setSelectedHour] = useState("08");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [enableNotification, setEnableNotification] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | undefined>(undefined);
  const [frequency, setFrequency] = useState<RoutineFrequency>(
    RoutineFrequency.DAILY,
  );
  const [weekDays, setWeekDays] = useState<DayOfWeek[]>([]);

  const isEditMode = !!routine;
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const { isSubscribed } = useNotifications();

  useEffect(() => {
    if (routine && open) {
      setTitle(routine.title);

      // Décomposer la durée totale (minutes) en heures + minutes
      if (routine.duration) {
        const hours = Math.floor(routine.duration / 60);
        const minutes = routine.duration % 60;
        setDurationHours(hours > 0 ? hours.toString() : "");
        setDurationMinutes(minutes > 0 ? minutes.toString() : "");
      } else {
        setDurationHours("");
        setDurationMinutes("");
      }

      // Convertir UTC → locale pour les sélecteurs
      if (routine.notificationTime) {
        const localTime = convertToLocal(routine.notificationTime);
        const [h, m] = localTime.split(":");
        setSelectedHour(h);
        setSelectedMinute(m);
        setEnableNotification(true);
      } else {
        setSelectedHour("08");
        setSelectedMinute("00");
        setEnableNotification(false);
      }

      setTimeOfDay(routine.timeOfDay);
      setFrequency(routine.frequency || RoutineFrequency.DAILY);
      setWeekDays(routine.weekDays || []);
    } else if (!open) {
      // Réinitialiser le formulaire à chaque fermeture du dialog
      setTitle("");
      setDurationHours("");
      setDurationMinutes("");
      setSelectedHour("08");
      setSelectedMinute("00");
      setEnableNotification(false);
      setTimeOfDay(undefined);
      setFrequency(RoutineFrequency.DAILY);
      setWeekDays([]);
    }
  }, [routine, open]);

  // À l'intérieur de CreateRoutineDialog
  useEffect(() => {
    // On ne vérifie que si le formulaire est ouvert et qu'on est en mode édition
    if (open && isEditMode && routine?.notificationTime) {
      if (Notification.permission !== "granted") {
        // On désactive le switch visuellement car la permission est absente
        setEnableNotification(false);

        // On prévient l'utilisateur avec un message clair
        toast.error(
          "Les notifications sont bloquées par votre navigateur. Le rappel a été désactivé.",
          {
            description: "Vérifiez vos paramètres de profil ou de navigateur.",
          },
        );
      }
    }
  }, [open, isEditMode, routine]);

  const toggleWeekDay = (day: DayOfWeek) => {
    setWeekDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    if (frequency === RoutineFrequency.WEEKLY && weekDays.length === 0) {
      toast.error("Sélectionnez au moins un jour de la semaine");
      return;
    }

    // Calculer la durée totale en minutes
    const hours = durationHours ? parseInt(durationHours) : 0;
    const minutes = durationMinutes ? parseInt(durationMinutes) : 0;
    const durationNum =
      hours > 0 || minutes > 0 ? hours * 60 + minutes : undefined;

    if (
      (durationHours || durationMinutes) &&
      (!durationNum || durationNum <= 0)
    ) {
      toast.error("La durée doit être supérieure à 0");
      return;
    }

    // Gestion des notifications avec conversion UTC
    let finalNotificationTime: string | undefined = undefined;

    if (enableNotification) {
      // Fusionner heure + minute et convertir en UTC
      const localTime = `${selectedHour}:${selectedMinute}`;
      finalNotificationTime = convertToUTC(localTime);
    }

    if (isEditMode && onUpdateRoutine && routine) {
      onUpdateRoutine({
        ...routine,
        title: title.trim(),
        duration: durationNum,
        hasTimer: !!durationNum,
        notificationTime: finalNotificationTime,
        timeOfDay,
        frequency,
        weekDays: frequency === RoutineFrequency.WEEKLY ? weekDays : undefined,
      });
      toast.success("Routine modifiée avec succès");
    } else if (onCreateRoutine) {
      onCreateRoutine({
        title: title.trim(),
        duration: durationNum,
        hasTimer: !!durationNum,
        notificationTime: finalNotificationTime,
        timeOfDay,
        frequency,
        weekDays: frequency === RoutineFrequency.WEEKLY ? weekDays : undefined,
      });
      toast.success("Routine créée avec succès");
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditMode && (
        <DialogTrigger asChild>
          <div className="fixed bottom-24 right-4 z-50 group">
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
      <DialogContent
        className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifier la routine" : "Créer une routine"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="after:content-['*'] after:ml-0.5">
              Titre de la routine{" "}
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Sport, Méditation..."
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Durée</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  id="durationHours"
                  type="number"
                  min="0"
                  max="23"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">Heures</p>
              </div>
              <div className="flex-1">
                <Input
                  id="durationMinutes"
                  type="number"
                  min="0"
                  max="59"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">Minutes</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Moment de la journée</Label>
            <RadioGroup
              value={timeOfDay || ""}
              onValueChange={(value) =>
                setTimeOfDay(value === "" ? undefined : (value as TimeOfDay))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={TimeOfDay.MORNING} id="morning" />
                <Label
                  htmlFor="morning"
                  className="cursor-pointer flex items-center gap-2 font-normal"
                >
                  <Sunrise className="h-4 w-4 text-amber-500" />
                  Matin
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={TimeOfDay.AFTERNOON} id="afternoon" />
                <Label
                  htmlFor="afternoon"
                  className="cursor-pointer flex items-center gap-2 font-normal"
                >
                  <Sun className="h-4 w-4 text-orange-500" />
                  Après-midi
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={TimeOfDay.EVENING} id="evening" />
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

          {/* Fréquence */}
          <div className="space-y-3">
            <Label>Fréquence</Label>
            <RadioGroup
              value={frequency}
              onValueChange={(value) => setFrequency(value as RoutineFrequency)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value={RoutineFrequency.DAILY}
                  id="freq-daily"
                />
                <Label
                  htmlFor="freq-daily"
                  className="cursor-pointer font-normal"
                >
                  Tous les jours
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value={RoutineFrequency.WEEKLY}
                  id="freq-weekly"
                />
                <Label
                  htmlFor="freq-weekly"
                  className="cursor-pointer font-normal"
                >
                  Certains jours de la semaine
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Jours de la semaine (si hebdomadaire) */}
          {frequency === RoutineFrequency.WEEKLY && (
            <div className="space-y-2">
              <Label>Jours de la semaine</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekDay(day.value)}
                    className={cn(
                      "w-10 h-10 rounded-full text-sm font-medium transition-colors",
                      weekDays.includes(day.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80",
                    )}
                    title={day.label}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {" "}
            {/* Conteneur parent pour espacer le bloc et le texte rouge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell
                  className={`h-4 w-4 ${enableNotification ? "text-primary" : "text-muted-foreground"}`}
                />
                <Label htmlFor="notification" className="cursor-pointer">
                  Notification quotidienne
                </Label>
              </div>

              <Switch
                id="notification"
                checked={enableNotification}
                disabled={!isSubscribed}
                onCheckedChange={(checked) => {
                  if (!isSubscribed) {
                    toast.error(
                      "Veuillez d'abord activer les notifications dans votre profil.",
                    );
                    return;
                  }
                  setEnableNotification(checked);
                }}
              />
            </div>
            {/* Le texte rouge s'affiche ici, en dessous du bloc principal */}
            {!isSubscribed && (
              <p className="text-xs text-center text-red-500 font-medium leading-tight">
                ⚠️ Les notifications sont désactivées. Activez-les dans votre
                profil.
              </p>
            )}
          </div>

          {enableNotification && (
            <div className="space-y-2">
              <Label htmlFor="notificationTime">Heure de la notification</Label>
              <div className="flex items-center gap-2">
                <Select value={selectedHour} onValueChange={setSelectedHour}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Heure" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}h
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">:</span>
                <Select
                  value={selectedMinute}
                  onValueChange={setSelectedMinute}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Minutes" />
                  </SelectTrigger>
                  <SelectContent>
                    {MINUTES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
