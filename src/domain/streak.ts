/**
 * @file domain/streak.ts
 * @description Calculs de streak — logique métier pure, aucune dépendance technique.
 */

import type { Routine, RoutineStatus } from "@/shared/types/routine";
import type { StreakReviveEntry } from "@/shared/types/revive";
import { getDayCompletionRate, getRoutinesAtDate } from "@/domain/routineRules";

/**
 * Calcule le streak global courant à partir d'un Record<date, taux> pré-calculé.
 * Utilisée par computeStreaks (statsService) → useStats → Routines.tsx / Stats.tsx.
 *
 * Logique avec reviveEntry :
 *   1. Si aujourd'hui n'est pas à 100% et n'est pas le jour du revive → on part d'hier.
 *   2. On remonte jour par jour :
 *      - 100% → streak++
 *      - date du revive → STOP, on retourne streak + reviveEntry.streak (streak sauvegardé)
 *      - autre (0%, undefined) → break
 *
 * Pourquoi "STOP + addition" au lieu de "passer à travers" :
 *   Le revive sauvegarde le streak exact au moment de l'activation. En s'arrêtant à cette
 *   date et en ajoutant la valeur sauvegardée, on évite de devoir traverser tout l'historique
 *   passé. Chaque nouveau revive "absorbe" le précédent dans sa valeur streak.
 *
 * ⚠️ Limitation restante : un jour tout-skippé (undefined dans completionRates) est traité
 * comme un jour manqué → break. À corriger dans computeCompletionRates.
 */
export function calculateCalendarStreak(
  completionRates: Record<string, number>,
  today: Date = new Date(),
  reviveEntry: StreakReviveEntry | null = null,
): number {
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  let streak = 0;
  let currentDate = new Date(today);
  const todayStr = fmt(currentDate);

  // Si aujourd'hui n'est pas à 100% et pas le jour du revive → on démarre à partir d'hier.
  if (completionRates[todayStr] !== 100 && reviveEntry?.date !== todayStr) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  while (true) {
    const dateStr = fmt(currentDate);
    if (completionRates[dateStr] === 100) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (completionRates[dateStr] === -1) {
      // Jour de repos (toutes routines skippées) → neutre, ne casse pas le streak.
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (reviveEntry && dateStr === reviveEntry.date) {
      // Jour du revive : on arrête et on ajoute le streak sauvegardé au moment de l'activation.
      return streak + reviveEntry.streak;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Calcule le streak d'une routine individuelle (jours consécutifs à 100% pour cette routine).
 * Utilisée uniquement par RoutineDetails.tsx — PAS pour le streak global.
 *
 * Contrairement à calculateCalendarStreak, utilise getDayCompletionRate qui retourne null
 * pour les jours tout-skippés → traités comme jours de repos (continue, ne casse pas).
 * C'est le comportement de référence correct pour les jours de repos.
 */
export function calculateStatStreak(
  routines: Routine[],
  statuses: RoutineStatus[],
  dates: string[],
  reviveDates: string[] = [],
): number {
  let streak = 0;
  let startIdx = dates.length - 1;

  const lastRate = getDayCompletionRate(routines, statuses, dates[startIdx]);
  if (lastRate !== 100 && !reviveDates.includes(dates[startIdx])) {
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
    } else if (reviveDates.includes(date)) {
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
