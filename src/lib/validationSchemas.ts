import { z } from "zod";

export const emailSchema = z.string().email("Email invalide");

export const passwordSchema = z
  .string()
  .min(6, "Le mot de passe doit contenir au moins 6 caractères");
