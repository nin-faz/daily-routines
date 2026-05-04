import { supabase } from "@/data/integrations/supabase/client";

export const freezeStorage = {
  async getStreakFreezeUsedAt(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("streak_freeze_used_at")
      .eq("id", user.id)
      .single();

    if (error || !data) return null;
    return (data as { streak_freeze_used_at: string | null }).streak_freeze_used_at;
  },

  async saveStreakFreezeUsedAt(date: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ streak_freeze_used_at: date } as never)
      .eq("id", user.id);
  },
};
