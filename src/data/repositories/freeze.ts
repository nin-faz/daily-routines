import { supabase } from "@/data/integrations/supabase/client";
import type { StreakFreezeEntry } from "@/shared/types/freeze";

export type { StreakFreezeEntry };

export const freezeStorage = {
  async getLastStreakFreeze(): Promise<StreakFreezeEntry | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("last_streak_freeze")
      .eq("id", user.id)
      .single();

    if (error || !data) return null;
    const entry = data.last_streak_freeze as StreakFreezeEntry | null;
    return entry ?? null;
  },

  async saveLastStreakFreeze(date: string, streak: number): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ last_streak_freeze: { date, streak } })
      .eq("id", user.id);

    // On throw pour que la mutation React Query si elle n'appelle pas onSuccess si l'update a échoué.
    if (error) throw new Error(error.message);
  },
};
