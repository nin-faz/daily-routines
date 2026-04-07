import { supabase } from "@/data/integrations/supabase/client";

/**
 * Supprime un utilisateur par son userId (action admin).
 * @returns null si succès, ou message d'erreur string si échec
 */
export async function deleteUser(userId: string): Promise<string | null> {
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (error) {
    return error.message || "Erreur lors de la suppression de l'utilisateur.";
  }
  return null;
}
