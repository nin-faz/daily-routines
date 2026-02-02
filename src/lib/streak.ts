import type { Routine, RoutineStatus } from "@/types/routine";
import { getDayCompletionRate } from "@/lib/utils";

/**
 * Calcule le streak pour l'affichage calendar (basé sur un objet {date: taux})
 * - Si aujourd'hui est complété, on commence à aujourd'hui, sinon à hier
 * - On remonte tant que le taux est 100
 * @param completionRates Record<string, number> (date YMD -> taux)
 * @param today Date de référence (par défaut aujourd'hui)
 */
export function calculateCalendarStreak(
  completionRates: Record<string, number>,
  today: Date = new Date()
): number {
  let streak = 0;
  let currentDate = new Date(today);
  const todayStr =
    typeof currentDate === "string"
      ? currentDate
      : `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
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
 * Calcule le streak actuel (jours consécutifs avec 100% de complétion, routines existantes à la date)
 * La logique est identique à celle du CalendarHeatmap.
 * @param routines Toutes les routines
 * @param statuses Tous les statuts de routine
 * @param dates Tableau de dates (format yyyy-MM-dd) à parcourir du plus ancien au plus récent
 * @returns nombre de jours de suite
 */
export function calculateStatStreak(
  routines: Routine[],
  statuses: RoutineStatus[],
  dates: string[]
): number {
  let streak = 0;
  // On part du plus récent et on remonte
  let startIdx = dates.length - 1;
  // Si le dernier jour n'est pas à 100, on commence à la veille
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
      // Jour ignoré (toutes routines skipped ou aucune routine)
      continue;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Calcule le record de streak (plus longue série de jours consécutifs à 100%)
 * @param routines Toutes les routines
 * @param statuses Tous les statuts de routine
 * @param dates Tableau de dates (format yyyy-MM-dd) à parcourir du plus ancien au plus récent
 * @returns nombre de jours du meilleur streak
 */
export function calculateLongestStreak(
  routines: Routine[],
  statuses: RoutineStatus[],
  dates: string[]
): number {
  let longest = 0;
  let current = 0;
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const rate = getDayCompletionRate(routines, statuses, date);
    if (rate === 100) {
      current++;
      if (current > longest) longest = current;
    } else if (rate === null) {
      // Jour ignoré (toutes routines skipped ou aucune routine)
      continue;
    } else {
      current = 0;
    }
  }
  return longest;
}
