// Utilitaires pour la gestion des dates (formatage, comparaison, etc.)

import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from "date-fns";
import type { Locale } from "date-fns";
import {format} from "date-fns";

/**
 * Formate une date JS en 'YYYY-MM-DD' (date locale, sans fuseau horaire)
 */
export function formatDateYMD(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** 
 * Formate une date en français avec jour de la semaine, jour, mois et année
 * Ex: "lundi 1 janvier 2024"
 */
export function formatFrenchDate(date: Date = new Date()): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Retourne un tableau de dates (string) pour le mois courant, formatées YMD
export function getDatesOfCurrentMonth(fromDate = new Date()): string[] {
  const start = startOfMonth(fromDate);
  const end = endOfMonth(fromDate);
  return eachDayOfInterval({ start, end }).map(formatDateYMD);
}

// Retourne un tableau de dates (Date) pour la semaine de la date donnée (lundi à dimanche)
export function getWeekDays(date: Date, options?: { locale?: Locale; weekStartsOn?: number }): Date[] {
  // date-fns expects weekStartsOn as Day (0-6), so cast if provided
  const opts =
    options ? { ...options, weekStartsOn: options.weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined } : undefined;
  const weekStart = startOfWeek(date, opts);
  const weekEnd = endOfWeek(date, opts);
  return eachDayOfInterval({ start: weekStart, end: weekEnd });
}

// Retourne un tableau de dates (string) pour les n derniers jours, formatées YMD
export function getLastNDates(n: number, fromDate = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => {
    const date = subDays(fromDate, n - 1 - i);
    return formatDateYMD(date);
  });
}

// Retourne un tableau de dates (string YMD) entre deux dates incluses
export function getDatesBetween(startDate: Date, endDate: Date): string[] {
  if (startDate > endDate) return [];
  return eachDayOfInterval({ start: startDate, end: endDate }).map(formatDateYMD);
}

/**
 * Retourne la date du jour au format 'YYYY-MM-DD' (date locale, sans fuseau horaire).
 * @returns Date du jour au format 'YYYY-MM-DD'
 */
export function getTodayString(): string {
  return formatDateYMD(new Date());
}

export function getYesterdayString(): string {
  return formatDateYMD(subDays(new Date(), 1));
}
