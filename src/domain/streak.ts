/**
 * @file domain/streak.ts
 * @description Calculs de streak — logique métier pure, aucune dépendance technique.
 */

import type { Routine, RoutineStatus } from "@/shared/types/routine";
import { getDayCompletionRate } from "@/domain/routineRules";

/**
 * Calcule le streak pour l'affichage calendar (basé sur un objet {date: taux}).
 */
export function calculateCalendarStreak(
  completionRates: Record<string, number>,
  today: Date = new Date()
): number {
  let streak = 0;
  let currentDate = new Date(today);
  const todayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

  if (completionRates[todayStr] !== 100) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  while (true) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
    if (completionRates[dateStr] === 100) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Calcule le streak actuel (jours consécutifs avec 100% de complétion).
 */
export function calculateStatStreak(
  routines: Routine[],
  statuses: RoutineStatus[],
  dates: string[]
): number {
  let streak = 0;
  let startIdx = dates.length - 1;

  const lastRate = getDayCompletionRate(routines, statuses, dates[startIdx]);
  if (lastRate !== 100) {
    startIdx--;
  }

  for (let i = startIdx; i >= 0; i--) {
    const date = dates[i];
    const rate = getDayCompletionRate(routines, statuses, date);
    if (rate === 100) {
      streak++;
    } else if (rate === null) {
      continue; // Jour ignoré (routines skipped ou aucune routine)
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Calcule le record de streak (plus longue série de jours consécutifs à 100%).
 */
export function calculateLongestStreak(
  routines: Routine[],
  statuses: RoutineStatus[],
  dates: string[]
): number {
  let longest = 0;
  let current = 0;

  for (let i = 0; i < dates.length; i++) {
    const rate = getDayCompletionRate(routines, statuses, dates[i]);
    if (rate === 100) {
      current++;
      if (current > longest) longest = current;
    } else if (rate === null) {
      continue;
    } else {
      current = 0;
    }
  }
  return longest;
}
