/**
 * @file routineRules.ts
 * @description Règles métier pures liées aux routines.
 * Ce fichier appartient au Domain : aucune dépendance technique (pas de Supabase, React, localStorage…).
 * Toutes les fonctions sont des transformations pures sur les entités Routine et RoutineStatus.
 */

import type { Routine, RoutineStatus } from "@/types/routine";
import { RoutineFrequency } from "@/types/routine";
import { JS_DAY_TO_DAY_OF_WEEK } from "@/lib/days";
import { formatDateYMD } from "@/lib/date";

/**
 * Retourne les routines existantes à une date donnée (format yyyy-MM-dd).
 * Filtre selon la date de création et la fréquence (quotidienne / hebdomadaire).
 *
 * @param routines - Liste de toutes les routines
 * @param selectedDate - Date cible au format 'YYYY-MM-DD'
 * @returns Les routines actives à cette date
 */
export function getRoutinesAtDate(routines: Routine[], selectedDate: string): Routine[] {
  return routines.filter((routine: Routine) => {
    const dateCreatedFromRoutine =
      typeof routine.createdAt === "string"
        ? new Date(routine.createdAt)
        : routine.createdAt;

    if (formatDateYMD(dateCreatedFromRoutine) > selectedDate) return false;

    const jsDate = new Date(selectedDate);
    const dayOfWeek = JS_DAY_TO_DAY_OF_WEEK[jsDate.getDay()];

    // Quotidienne : toujours active
    if (!routine.frequency || routine.frequency === RoutineFrequency.DAILY) {
      return true;
    }
    // Hebdomadaire : active seulement si le jour est dans weekDays
    if (routine.frequency === RoutineFrequency.WEEKLY && routine.weekDays) {
      return routine.weekDays.includes(dayOfWeek);
    }
    return false;
  });
}

/**
 * Retourne les routines actives à une date donnée, en excluant celles marquées "skipped".
 *
 * @param routines - Liste de toutes les routines
 * @param statuses - Liste de tous les statuts
 * @param selectedDate - Date cible au format 'YYYY-MM-DD'
 * @returns Les routines non-sautées à cette date
 */
export function getActiveRoutinesAtDate(
  routines: Routine[],
  statuses: RoutineStatus[],
  selectedDate: string
): Routine[] {
  const routinesAtDate = getRoutinesAtDate(routines, selectedDate);
  return routinesAtDate.filter((routine) => {
    const status = statuses.find(
      (s) => s.date === selectedDate && s.routineId === routine.id
    );
    return !status || !status.skipped;
  });
}

/**
 * Calcule le taux de complétion d'un jour donné.
 * - Retourne `null` si aucune routine ou si toutes sont skipped (jour ignoré)
 * - Retourne 100 si toutes les non-skipped sont complétées
 * - Sinon retourne le pourcentage arrondi
 *
 * @param routines - Liste de toutes les routines
 * @param statuses - Liste de tous les statuts
 * @param date - Date cible au format 'YYYY-MM-DD'
 * @returns Taux de complétion (0-100) ou null si jour ignoré
 */
export function getDayCompletionRate(
  routines: Routine[],
  statuses: RoutineStatus[],
  date: string
): number | null {
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

/**
 * Calcule le taux de complétion d'un ensemble de routines pour une date donnée.
 * Utilisé pour l'affichage en temps réel (ex: DayRoutinesList).
 *
 * @param routines - Routines filtrées pour la date
 * @param statuses - Statuts du jour
 * @returns Objet contenant completedCount, total et rate (%)
 */
export function getRoutineCompletionRate(
  routines: Routine[],
  statuses: RoutineStatus[]
): { completedCount: number; total: number; rate: number } {
  const total = routines.length;
  if (total === 0) return { completedCount: 0, total: 0, rate: 0 };

  const routineStatuses = routines.map((routine) => {
    const status = statuses.find((s) => s.routineId === routine.id);
    return {
      completed: !!status?.completed,
      skipped: !!status?.skipped,
    };
  });

  const nonSkipped = routineStatuses.filter((s) => !s.skipped);
  const completedCount = nonSkipped.filter((s) => s.completed).length;
  const nonSkippedCount = nonSkipped.length;

  if (nonSkippedCount === 0) return { completedCount: 0, total, rate: 0 };
  if (completedCount === nonSkippedCount) return { completedCount, total, rate: 100 };

  const rate = Math.round((completedCount / nonSkippedCount) * 100);
  return { completedCount, total, rate };
}
