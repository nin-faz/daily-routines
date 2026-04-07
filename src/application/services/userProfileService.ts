/**
 * @file services/userProfileService.ts
 * @description Centralise tous les accès à la table `profiles`.
 *
 * Avant ce service, trois fichiers appelaient Supabase directement sur `profiles` :
 * - Profile.tsx (lecture pseudo, écriture pseudo)
 * - UserContext.tsx (lecture role)
 * - ThemeContext.tsx (lecture color_theme + mode_theme, écriture des deux)
 *
 * Désormais, un seul endroit connaît la structure de cette table.
 */

import { supabase } from "@/data/integrations/supabase/client";
import type { ThemePalette } from "@/shared/types/theme";

export interface ProfileData {
  pseudo?: string | null;
  role?: string | null;
  colorTheme?: ThemePalette | null;
  modeTheme?: string | null;
}

/**
 * Récupère les données de profil d'un utilisateur.
 */
export async function getProfile(userId: string): Promise<ProfileData> {
  const { data, error } = await supabase
    .from("profiles")
    .select("pseudo, role, color_theme, mode_theme")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Erreur lors de la récupération du profil:", error);
  }

  if (!data) return {};

  return {
    pseudo: data.pseudo ?? null,
    role: data.role ?? null,
    colorTheme: (data.color_theme as ThemePalette) ?? null,
    modeTheme: data.mode_theme ?? null,
  };
}

/**
 * Met à jour les données de profil d'un utilisateur.
 * Seuls les champs fournis sont mis à jour (upsert partiel).
 */
export async function updateProfile(
  userId: string,
  updates: {
    pseudo?: string;
    email?: string;
    colorTheme?: ThemePalette;
    modeTheme?: string;
  }
): Promise<void> {
  const row: Record<string, string> = { updated_at: new Date().toISOString() };

  if (updates.pseudo !== undefined) row.pseudo = updates.pseudo;
  if (updates.email !== undefined) row.email = updates.email;
  if (updates.colorTheme !== undefined) row.color_theme = updates.colorTheme;
  if (updates.modeTheme !== undefined) row.mode_theme = updates.modeTheme;

  const { error } = await supabase
    .from("profiles")
    .update(row)
    .eq("id", userId);

  if (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    throw error;
  }
}

/**
 * Crée ou met à jour un profil utilisateur (utilisé à l'inscription).
 */
export async function upsertProfile(
  userId: string,
  data: { pseudo?: string; email: string }
): Promise<void> {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email: data.email,
      pseudo: data.pseudo ?? "",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("Erreur lors de l'upsert du profil:", error);
    throw error;
  }
}
