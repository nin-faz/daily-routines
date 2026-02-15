import type { Routine, RoutineStatus } from "@/types/routine";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDateYMD } from "@/lib/date";

// Calcule le taux de réussite d'un jour donné
// - Si toutes les routines sont skipped, retourne null (jour ignoré)
// - Si toutes les non-skipped sont complétées, retourne 100
// - Sinon, retourne le pourcentage de complétion
export function getDayCompletionRate(routines: Routine[], statuses: RoutineStatus[], date: string): number | null {
  const routinesAtDate = getRoutinesAtDate(routines, date);
  if (routinesAtDate.length === 0) return null;
  const nonSkipped = routinesAtDate.filter((routine) => {
    const status = statuses.find((s) => s.date === date && s.routineId === routine.id);
    return !status || !status.skipped;
  });
  if (nonSkipped.length === 0) return null; // toutes skipped
  const completed = nonSkipped.filter((routine) => {
    const status = statuses.find((s) => s.date === date && s.routineId === routine.id);
    return status && status.completed;
  });
  return Math.round((completed.length / nonSkipped.length) * 100);
}

// Calcule le taux de réussite d'un ensemble de routines pour une date donnée
export function getRoutineCompletionRate(routines: Routine[], statuses: RoutineStatus[]) {
  const total = routines.length;
  if (total === 0) return { completedCount: 0, total: 0, rate: 0 };

  // Associe chaque routine à son statut
  const routineStatuses = routines.map(routine => {
    const status = statuses.find(s => s.routineId === routine.id);
    return {
      completed: !!status?.completed,
      skipped: !!status?.skipped,
    };
  });

  const nonSkipped = routineStatuses.filter(s => !s.skipped);
  const completedCount = nonSkipped.filter(s => s.completed).length;
  const nonSkippedCount = nonSkipped.length;

  /** Les routine qui sont à faire */
  if (nonSkippedCount === 0) return { completedCount: 0, total, rate: 0 };

  /** Toutes les routines sont complétées */
  if (completedCount === nonSkippedCount) return { completedCount, total, rate: 100 };
  const rate = Math.round((completedCount / nonSkippedCount) * 100);
  return { completedCount, total, rate };
}

// Helpers date déplacés dans lib/date.ts

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formate une date en 'yyyy-MM-dd' (date locale)

// Retourne les routines existantes à une date donnée (format yyyy-MM-dd)
export function getRoutinesAtDate(routines: Routine[], selectedDate: string): Routine[] {
  return routines.filter((routine) => {
    const dateCreatedFromRoutine = typeof routine.createdAt === "string" ? new Date(routine.createdAt) : routine.createdAt;
    return formatDateYMD(dateCreatedFromRoutine) <= selectedDate;
  });
}

// Retourne les routines existantes à une date donnée, en excluant celles marquées "skipped" pour cette date
export function getActiveRoutinesAtDate(routines: Routine[], statuses: RoutineStatus[], selectedDate: string): Routine[] {
  const routinesAtDate = getRoutinesAtDate(routines, selectedDate);
  return routinesAtDate.filter((selectedRoutineAtDate) => {
    const statusesForRoutine = statuses.find((statusesForRoutine) => statusesForRoutine.date === selectedDate && statusesForRoutine.routineId === selectedRoutineAtDate.id);
    return !statusesForRoutine || !statusesForRoutine.skipped;
  });
}