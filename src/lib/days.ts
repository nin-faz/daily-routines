import { DayOfWeek, Routine, RoutineFrequency, TimeOfDay } from "@/types/routine";

// Labels courts pour les jours de la semaine (calendrier)
const DAY_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "L",
  [DayOfWeek.TUESDAY]: "M",
  [DayOfWeek.WEDNESDAY]: "Me",
  [DayOfWeek.THURSDAY]: "J",
  [DayOfWeek.FRIDAY]: "V",
  [DayOfWeek.SATURDAY]: "S",
  [DayOfWeek.SUNDAY]: "D",
};

export function getDayLabel(day: DayOfWeek | string): string {
  // Accepte DayOfWeek enum ou string
  const key = day.toLowerCase() as DayOfWeek;
  return DAY_LABELS[key] || day.charAt(0).toUpperCase();
}

// Mapper le jour JS (0-6) vers notre DayOfWeek
export const JS_DAY_TO_DAY_OF_WEEK: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

// Retourne un label humain pour la fréquence d'une routine
export function getFrequencyLabel(frequency?: RoutineFrequency | string) {
  if (frequency === RoutineFrequency.DAILY || frequency === "DAILY")
    return "Quotidienne";
  if (frequency === RoutineFrequency.WEEKLY || frequency === "WEEKLY")
    return "Hebdomadaire";
  return "";
}

export function getTimeOfDayLabel(timeOfDay: TimeOfDay) {
  return {
    [TimeOfDay.MORNING]: {
      label: "Matin",
      color: "text-amber-500",
    },
    [TimeOfDay.AFTERNOON]: {
      label: "Après-midi",
      color: "text-orange-500",
    },
    [TimeOfDay.EVENING]: {
      label: "Soir",
      color: "text-indigo-500",
    },
  }[timeOfDay];
}

export function getTodaysRoutines(
  routines: Routine[],
  todayDayOfWeek: DayOfWeek,
): Routine[] {
  return routines.filter((routine) => {
    if (!routine.frequency || routine.frequency === RoutineFrequency.DAILY) {
      return true;
    }
    if (routine.frequency === RoutineFrequency.WEEKLY && routine.weekDays) {
      return routine.weekDays.includes(todayDayOfWeek);
    }
    return false;
  });
}

export function groupByTimeOfDay(routineList: Routine[]) {
  return {
    [TimeOfDay.MORNING]: routineList.filter(
      (r) => r.timeOfDay === TimeOfDay.MORNING,
    ),
    [TimeOfDay.AFTERNOON]: routineList.filter(
      (r) => r.timeOfDay === TimeOfDay.AFTERNOON,
    ),
    [TimeOfDay.EVENING]: routineList.filter(
      (r) => r.timeOfDay === TimeOfDay.EVENING,
    ),
    untagged: routineList.filter((r) => !r.timeOfDay),
  };
}
