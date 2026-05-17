import { supabase } from "@/data/integrations/supabase/client";
import type { StreakReviveEntry } from "@/shared/types/revive";

export type { StreakReviveEntry };

export const reviveStorage = {
  async getLastStreakRevive(): Promise<StreakReviveEntry | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("last_streak_revive")
      .eq("id", user.id)
      .single();

    if (error || !data) return null;
    const entry = data.last_streak_revive as StreakReviveEntry | null;
    return entry ?? null;
  },

  async saveLastStreakRevive(date: string, streak: number): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from("profiles")
      .update({ last_streak_revive: { date, streak, activatedAt: today } })
      .eq("id", user.id);

    if (error) throw new Error(error.message);
  },
};
