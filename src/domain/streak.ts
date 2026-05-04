/**
 * @file domain/streak.ts
 * @description Calculs de streak — logique métier pure, aucune dépendance technique.
 */

import type { Routine, RoutineStatus } from "@/shared/types/routine";
import { getDayCompletionRate, getRoutinesAtDate } from "@/domain/routineRules";

/**
 * Calcule le streak pour l'affichage calendar (basé sur un objet {date: taux}).
 * Les freezeDates sont des jours "neutres" : ne comptent pas, ne cassent pas le streak.
 */
export function calculateCalendarStreak(
  completionRates: Record<string, number>,
  today: Date = new Date(),
  freezeDates: string[] = [],
): number {
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  let streak = 0;
  let currentDate = new Date(today);
  const todayStr = fmt(currentDate);

  if (completionRates[todayStr] !== 100 && !freezeDates.includes(todayStr)) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  while (true) {
    const dateStr = fmt(currentDate);
    if (completionRates[dateStr] === 100) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (freezeDates.includes(dateStr)) {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Calcule le streak actuel (jours consécutifs avec 100% de complétion).
 * Les jours présents dans freezeDates ne cassent pas le streak.
 */
export function calculateStatStreak(
  routines: Routine[],
  statuses: RoutineStatus[],
  dates: string[],
  freezeDates: string[] = [],
): number {
  let streak = 0;
  let startIdx = dates.length - 1;

  const lastRate = getDayCompletionRate(routines, statuses, dates[startIdx]);
  if (lastRate !== 100 && !freezeDates.includes(dates[startIdx])) {
    startIdx--;
  }

  for (let i = startIdx; i >= 0; i--) {
    const date = dates[i];
    const rate = getDayCompletionRate(routines, statuses, date);
    if (rate === 100) {
      streak++;
    } else if (rate === null) {
      // Pas de routine ce jour-là → trou dans l'historique → stop
      if (getRoutinesAtDate(routines, date).length === 0) break;
      // Toutes les routines ont été marquées comme "skipped" → jour de repos → ne pas casser le streak
      continue;
    } else if (freezeDates.includes(date)) {
      continue; // Jour gelé — ne casse pas le streak, ne l'incrémente pas
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
  dates: string[],
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
