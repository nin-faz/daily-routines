import { Routine, RoutineStatus, TimeOfDay, RoutineFrequency, DayOfWeek } from "@/shared/types/routine";
import { getActiveRoutinesAtDate } from "@/domain/routineRules";
import { formatDateYMD } from "@/shared/lib/date";
import { supabase } from "@/data/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/data/integrations/supabase/types";

export const routineStorage = {
  async getRoutines(): Promise<Routine[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("routines")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching routines:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      duration: row.duration ?? undefined,
      hasTimer: row.has_timer,
      notificationTime: row.notification_time ?? undefined,
      timeOfDay: row.time_of_day as TimeOfDay | undefined,
      frequency: (row.frequency as RoutineFrequency) || RoutineFrequency.DAILY,
      weekDays: (row.week_days as DayOfWeek[]) ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? row.created_at,
      isArchived: row.is_archived ?? false,
    }));
  },

  async addRoutine(routine: Routine): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const row: TablesInsert<"routines"> = {
      id: routine.id,
      user_id: user.id,
      title: routine.title,
      duration: routine.duration ?? null,
      has_timer: routine.hasTimer,
      notification_time: routine.notificationTime ?? null,
      time_of_day: routine.timeOfDay ?? null,
      frequency: routine.frequency || RoutineFrequency.DAILY,
      week_days: routine.weekDays ?? null,
    };

    const { error } = await supabase.from("routines").insert(row);
    if (error) {
      console.error("Error adding routine:", error);
      throw error;
    }
  },

  async updateRoutine(id: string, updates: Partial<Routine>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const row: TablesUpdate<"routines"> = {};
    if ("title" in updates) row.title = updates.title;
    if ("duration" in updates) row.duration = updates.duration ?? null;
    if ("hasTimer" in updates) row.has_timer = updates.hasTimer;
    if ("notificationTime" in updates) row.notification_time = updates.notificationTime ?? null;
    if ("timeOfDay" in updates) row.time_of_day = updates.timeOfDay ?? null;
    if ("frequency" in updates) row.frequency = updates.frequency ?? RoutineFrequency.DAILY;
    if ("weekDays" in updates) row.week_days = updates.weekDays ?? null;
    if ("isArchived" in updates) row.is_archived = updates.isArchived;

    const { error } = await supabase
      .from("routines")
      .update(row)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating routine:", error);
      throw error;
    }
  },

  async deleteRoutine(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("routines")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting routine:", error);
      throw error;
    }
  },

  async getStatuses(): Promise<RoutineStatus[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("routine_statuses")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching routine statuses:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      routineId: row.routine_id,
      userId: row.user_id,
      date: row.date,
      completed: row.completed,
      completedAt: row.completed_at ?? undefined,
      skipped: row.skipped,
      createdAt: row.created_at,
    }));
  },

  async getStatusesForDate(date: string): Promise<RoutineStatus[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("routine_statuses")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date);

    if (error) {
      console.error("Erreur lors de la récupération des statuts pour la date:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      routineId: row.routine_id,
      userId: row.user_id,
      date: row.date,
      completed: row.completed,
      completedAt: row.completed_at ?? undefined,
      skipped: row.skipped,
      createdAt: row.created_at,
    }));
  },

  async getTodayStatus(routineId: string, today: string): Promise<RoutineStatus | undefined> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return undefined;

    const { data, error } = await supabase
      .from("routine_statuses")
      .select("*")
      .eq("routine_id", routineId)
      .eq("date", today)
      .eq("user_id", user.id)
      .single();

    if (error || !data) return undefined;

    return {
      id: data.id,
      routineId: data.routine_id,
      userId: data.user_id,
      date: data.date,
      completed: data.completed,
      completedAt: data.completed_at ?? undefined,
      skipped: data.skipped,
      createdAt: data.created_at,
    };
  },

  async toggleRoutineComplete(routineId: string, today: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const existing = await this.getTodayStatus(routineId, today);

    if (existing?.completed) {
      const { error } = await supabase
        .from("routine_statuses")
        .delete()
        .eq("routine_id", routineId)
        .eq("date", today)
        .eq("user_id", user.id);
      if (error) throw error;
    } else if (!existing) {
      const { error } = await supabase.from("routine_statuses").insert({
        routine_id: routineId,
        user_id: user.id,
        date: today,
        completed: true,
        completed_at: new Date().toISOString(),
        skipped: false,
      });
      if (error) throw error;
    }
  },

  async skipRoutineToday(routineId: string, today: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const hasTodayStatus = await this.getTodayStatus(routineId, today);

    if (hasTodayStatus && hasTodayStatus.skipped) {
      const { error } = await supabase
        .from("routine_statuses")
        .delete()
        .eq("routine_id", routineId)
        .eq("date", today)
        .eq("user_id", user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("routine_statuses").insert({
        routine_id: routineId,
        user_id: user.id,
        date: today,
        completed: false,
        skipped: true,
      });
      if (error) throw error;
    }
  },

  async getCompletionRatesForMonth(year: number, month: number): Promise<Record<string, number>> {
    const routines = await this.getRoutines();
    if (routines.length === 0) return {};

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const allDates: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      allDates.push(formatDateYMD(new Date(d)));
    }

    const statuses = await this.getStatuses();
    const rates: Record<string, number> = {};

    for (const date of allDates) {
      const activeRoutines = getActiveRoutinesAtDate(routines, statuses, date);
      if (activeRoutines.length === 0) continue;
      const completedCount = activeRoutines.filter((routine) => {
        const status = statuses.find((s) => s.routineId === routine.id && s.date === date);
        return status && status.completed;
      }).length;
      rates[date] = Math.round((completedCount / activeRoutines.length) * 100);
    }
    return rates;
  },

  async getCompletionRatesForWeek(startDate: string, endDate: string): Promise<Record<string, number>> {
    const routines = await this.getRoutines();
    if (routines.length === 0) return {};

    const start = new Date(startDate);
    const end = new Date(endDate);
    const allDates: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      allDates.push(formatDateYMD(new Date(d)));
    }

    const statuses = await this.getStatuses();
    const rates: Record<string, number> = {};

    for (const date of allDates) {
      const activeRoutines = getActiveRoutinesAtDate(routines, statuses, date);
      if (activeRoutines.length === 0) continue;
      const completedCount = activeRoutines.filter((routine) => {
        const status = statuses.find((s) => s.routineId === routine.id && s.date === date);
        return status && status.completed;
      }).length;
      rates[date] = Math.round((completedCount / activeRoutines.length) * 100);
    }
    return rates;
  },
};
