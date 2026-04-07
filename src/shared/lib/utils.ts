/**
 * @file utils.ts
 * @description Utilitaires UI uniquement.
 * Ce fichier ne contient que `cn()`, helper Tailwind CSS.
 * Les règles métier des routines ont été déplacées dans `src/lib/routineRules.ts`.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne des classes Tailwind CSS en gérant les conflits.
 * @param inputs - Classes CSS à fusionner
 * @returns Chaîne de classes CSS fusionnée
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
