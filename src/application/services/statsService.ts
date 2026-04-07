/**
 * @file statsService.ts
 * @description Calculs statistiques purs — aucune dépendance React, Supabase ou UI.
 * Toutes les fonctions prennent des données brutes et retournent des valeurs calculées.
 * Testables unitairement sans monter de composant.
 */

import { addDays, endOfDay, isWithinInterval, startOfDay } from "date-fns";
import { getActiveRoutinesAtDate } from "@/domain/routineRules";
import { calculateStatStreak, calculateLongestStreak } from "@/domain/streak";
import { formatDateYMD } from "@/shared/lib/date";
import type { Routine, RoutineStatus } from "@/shared/types/routine";
import type { Task } from "@/shared/types/task";

// ---------------------------------------------------------------------------
// Types de sortie
// ---------------------------------------------------------------------------

export type DailyCompletionPoint = {
  date: string;  // format dd/MM pour l'affichage
  taux: number;
};

export type WeeklyDataPoint = {
  jour: string;
  complétées: number;
  sautees: number;
  total: number;
};

export type TasksByStatus = {
  todo: number;
  done: number;
};

export type RoutineStats = {
  overallCompletionRate: number;
  currentStreak: number;
  recordStreak: number;
  completionsByDate: DailyCompletionPoint[];
  weeklyData: WeeklyDataPoint[];
};

export type TaskStats = {
  tasksByStatus: TasksByStatus;
  tasksCompletionRate: number;
  upcomingDeadlines: number;
};

// ---------------------------------------------------------------------------
// Routine stats
// ---------------------------------------------------------------------------

/**
 * Taux de complétion par date — alimente le graphique linéaire mensuel.
 */
export function computeCompletionsByDate(
  routines: Routine[],
  statuses: RoutineStatus[],
  dates: string[]
): DailyCompletionPoint[] {
  return dates.map((date) => {
    const activeRoutines = getActiveRoutinesAtDate(routines, statuses, date);
    const completed = activeRoutines.filter((r) => {
      const s = statuses.find((s) => s.date === date && s.routineId === r.id);
      return s?.completed;
    }).length;
    return {
      date: date.slice(8, 10) + "/" + date.slice(5, 7), // yyyy-MM-dd → dd/MM
      taux: activeRoutines.length > 0
        ? Math.round((completed / activeRoutines.length) * 100)
        : 0,
    };
  });
}

/**
 * Taux global de complétion sur une plage de dates (jusqu'à aujourd'hui inclus).
 */
export function computeOverallCompletionRate(
  routines: Routine[],
  statuses: RoutineStatus[],
  datesUpToToday: string[]
): number {
  let totalRoutines = 0;
  let totalCompleted = 0;

  for (const date of datesUpToToday) {
    const activeRoutines = getActiveRoutinesAtDate(routines, statuses, date);
    for (const routine of activeRoutines) {
      totalRoutines++;
      const s = statuses.find((s) => s.date === date && s.routineId === routine.id);
      if (s?.completed) totalCompleted++;
    }
  }

  return totalRoutines > 0 ? Math.round((totalCompleted / totalRoutines) * 100) : 0;
}

/**
 * Génère toutes les dates depuis la création de la première routine jusqu'à aujourd'hui.
 * Utilisé pour calculer les streaks sur l'historique complet.
 */
export function getRoutineDateRange(routines: Routine[], today: Date): string[] {
  if (routines.length === 0) return [];

  const firstDate = routines.reduce((min, r) => {
    const d = typeof r.createdAt === "string" ? new Date(r.createdAt) : r.createdAt;
    return d < min ? d : min;
  }, new Date());

  const dates: string[] = [];
  const cursor = new Date(firstDate);
  const todayStr = formatDateYMD(today);

  while (formatDateYMD(cursor) <= todayStr) {
    dates.push(formatDateYMD(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

/**
 * Données de la semaine courante pour le graphique en barres.
 * @param weekDays Tableau de Date représentant chaque jour de la semaine
 * @param dayLabel Fonction qui formate une Date en label (ex: "lun.")
 */
export function computeWeeklyData(
  routines: Routine[],
  statuses: RoutineStatus[],
  weekDays: Date[],
  dayLabel: (day: Date) => string
): WeeklyDataPoint[] {
  return weekDays.map((day) => {
    const formattedDate = formatDateYMD(day);
    const routinesAtDate = routines.filter((r) => {
      const created = typeof r.createdAt === "string" ? new Date(r.createdAt) : r.createdAt;
      return formatDateYMD(created) <= formattedDate;
    });

    let completed = 0;
    let skipped = 0;

    for (const routine of routinesAtDate) {
      const s = statuses.find(
        (s) => s.date === formattedDate && s.routineId === routine.id
      );
      if (s?.skipped) skipped++;
      else if (s?.completed) completed++;
    }

    return {
      jour: dayLabel(day),
      complétées: completed,
      sautees: skipped,
      total: routinesAtDate.length,
    };
  });
}

/**
 * Calcule le streak courant et le record depuis toutes les routines.
 */
export function computeStreaks(
  routines: Routine[],
  statuses: RoutineStatus[],
  allDates: string[]
): { currentStreak: number; recordStreak: number } {
  return {
    currentStreak: calculateStatStreak(routines, statuses, allDates),
    recordStreak: calculateLongestStreak(routines, statuses, allDates),
  };
}

// ---------------------------------------------------------------------------
// Task stats
// ---------------------------------------------------------------------------

/**
 * Nombre de tâches par statut.
 */
export function computeTasksByStatus(tasks: Task[]): TasksByStatus {
  return {
    todo: tasks.filter((t) => t.status === "todo").length,
    done: tasks.filter((t) => t.status === "done").length,
  };
}

/**
 * Taux de complétion global des tâches.
 */
export function computeTasksCompletionRate(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "done").length;
  return Math.round((done / tasks.length) * 100);
}

/**
 * Nombre de tâches avec une deadline dans les N prochains jours (non terminées).
 */
export function computeUpcomingDeadlines(
  tasks: Task[],
  today: Date,
  daysAhead = 7
): number {
  const start = startOfDay(today);
  const end = endOfDay(addDays(today, daysAhead));

  return tasks.filter((task) => {
    if (!task.deadline || task.status === "done") return false;
    const deadline = new Date(task.deadline + "T00:00:00");
    return isWithinInterval(deadline, { start, end });
  }).length;
}
