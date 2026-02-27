import { z } from "zod";

// --- AUTHENTIFICATION ---
export const emailSchema = z.string().email("Email invalide");

export const passwordSchema = z
  .string()
  .min(6, "Le mot de passe doit contenir au moins 6 caractères");

// --- TÂCHES (TASKS) ---
export const taskSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(100, "Le titre est trop long (100 caractères max)"),
  description: z.string().trim().max(500, "La description est trop longue (500 caractères max)").optional(),
});

// --- DOSSIERS (FOLDERS) ---
export const folderSchema = z.object({
  name: z.string().trim().min(1, "Le nom du dossier est requis").max(50, "Le nom est trop long (50 caractères max)"),
});

// --- ROUTINES ---
export const routineSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(100, "Le titre est trop long (100 caractères max)"),
  // Le minuteur ne doit pas dépasser 23h59 (1439 minutes)
  duration: z.number().positive("La durée doit être positive").max(1439, "La durée est trop longue").optional(),
});