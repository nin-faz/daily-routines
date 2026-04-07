/**
 * @file domain/builders.ts
 * @description Constructeurs d'entités du domaine.
 * Centralise la logique de création pour éviter la duplication entre
 * mutationFn et onMutate dans les hooks React Query.
 */

import type { Routine } from "@/shared/types/routine";
import { RoutineFrequency } from "@/shared/types/routine";
import type { Folder } from "@/shared/types/folder";
import type { Task } from "@/shared/types/task";
import { Status } from "@/shared/types/task";

export function buildRoutine(
  data: Omit<Routine, "id" | "createdAt" | "userId" | "updatedAt">,
  userId: string,
): Routine {
  const now = new Date().toISOString();
  return {
    ...data,
    id: crypto.randomUUID(),
    userId,
    frequency: data.frequency ?? RoutineFrequency.DAILY,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildFolder(
  data: Omit<Folder, "id" | "createdAt" | "userId" | "updatedAt">,
  userId: string,
): Folder {
  const now = new Date().toISOString();
  return {
    ...data,
    id: crypto.randomUUID(),
    userId,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildTask(
  data: Omit<Task, "id" | "createdAt" | "userId" | "updatedAt" | "status">,
  userId: string,
): Task {
  const now = new Date().toISOString();
  return {
    ...data,
    id: crypto.randomUUID(),
    userId,
    status: Status.TODO,
    createdAt: now,
    updatedAt: now,
  };
}
