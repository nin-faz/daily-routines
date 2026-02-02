import { Routine, RoutineStatus, TimeOfDay } from "@/types/routine";
import { getActiveRoutinesAtDate } from "@/lib/utils";
import { formatDateYMD } from "@/lib/date";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export const routineStorage = {
  // Routines (CRUD)
  async getRoutines(): Promise<Routine[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      title: row.title,
      duration: row.duration ?? undefined,
      hasTimer: row.has_timer,
      notificationTime: row.notification_time ?? undefined,
      timeOfDay: row.time_of_day as TimeOfDay | undefined,
      createdAt: row.created_at,
    }));
  },

  async addRoutine(routine: Routine): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const row: TablesInsert<"routines"> = {
      id: routine.id,
      user_id: user.id,
      title: routine.title,
      duration: routine.duration ?? null,
      has_timer: routine.hasTimer,
      notification_time: routine.notificationTime ?? null,
      time_of_day: routine.timeOfDay ?? null,
    };

    const { error } = await supabase.from("routines").insert(row);

    if (error) {
      console.error("Error adding routine:", error);
      throw error;
    }
  },

  async updateRoutine(id: string, updates: Partial<Routine>): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const row: TablesUpdate<"routines"> = {};
    if ("title" in updates) row.title = updates.title;
    if ("duration" in updates) row.duration = updates.duration ?? null;
    if ("hasTimer" in updates) row.has_timer = updates.hasTimer;
    if ("notificationTime" in updates)
      row.notification_time = updates.notificationTime ?? null;
    if ("timeOfDay" in updates)
      row.time_of_day = updates.timeOfDay ?? null;

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Supabase cascade delete will handle routine_statuses
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

  // Statuts des routines
  async getStatuses(): Promise<RoutineStatus[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      routineId: row.routine_id,
      date: row.date,
      completed: row.status === "completed",
      completedAt: row.status === "completed" ? row.created_at : undefined,
      skipped: row.status === "skipped",
    }));
  },

  async getTodayStatus(
    routineId: string,
    today: string
  ): Promise<RoutineStatus | undefined> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      routineId: data.routine_id,
      date: data.date,
      completed: data.status === "completed",
      completedAt: data.status === "completed" ? data.created_at : undefined,
      skipped: data.status === "skipped",
    };
  },

  /**
   * Gère le clic sur la checkbox d'une routine :
   * - Si la routine est sautée (skipped), ne fait rien (on ne peut pas cocher une routine sautée)
   * - Si la routine est complétée, décocher = supprimer le statut
   * - Si pas de statut, cocher = créer un statut "completed"
   */
  async toggleRoutineComplete(routineId: string, today: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const existing = await this.getTodayStatus(routineId, today);

    if (existing?.skipped) {
      // Si la routine est sautée, cliquer sur la checkbox ne fait rien
      return;
    } else if (existing?.completed) {
      // Si déjà complétée, décocher = supprimer le statut
      const { error } = await supabase
        .from("routine_statuses")
        .delete()
        .eq("routine_id", routineId)
        .eq("date", today)
        .eq("user_id", user.id);
      if (error) {
        console.error("Erreur lors de la suppression du statut:", error);
        throw error;
      }
    } else if (!existing) {
      // Si pas de statut, cocher = créer completed
      const { error } = await supabase.from("routine_statuses").insert({
        routine_id: routineId,
        user_id: user.id,
        date: today,
        status: "completed",
      });
      if (error) {
        console.error("Erreur lors de la création du statut:", error);
        throw error;
      }
    }
  },

  async skipRoutineToday(routineId: string, today: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const hasTodayStatus = await this.getTodayStatus(routineId, today);

    if (hasTodayStatus && hasTodayStatus.skipped) {
      // Si déjà sauté, on supprime le statut pour annuler
      const { error } = await supabase
        .from("routine_statuses")
        .delete()
        .eq("routine_id", routineId)
        .eq("date", today)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }
    } else if (hasTodayStatus && hasTodayStatus.completed) {
      // Si complété, on ne peut pas sauter
      return;
    } else {
      // Sinon on crée un nouveau statut "sauté"
      const { error } = await supabase.from("routine_statuses").insert({
        routine_id: routineId,
        user_id: user.id,
        date: today,
        status: "skipped",
      });

      if (error) {
        throw error;
      }
    }
  },

  // Statistiques pour le calendrier
  async getCompletionRateForDate(date: string): Promise<number> {
    const routines = await this.getRoutines();
    if (routines.length === 0) return 0;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from("routine_statuses")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date)
      .eq("status", "completed");

    if (error) {
      console.error("Erreur lors de la récupération du taux de complétion:", error);
      return 0;
    }

    const completedCount = data?.length || 0;
    return Math.round((completedCount / routines.length) * 100);
  },

  async getCompletionRatesForMonth(
    year: number,
    month: number
  ): Promise<Record<string, number>> {
    const routines = await this.getRoutines();
    if (routines.length === 0) return {};

    // Récupère tous les statuts pour le mois
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const allDates: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      allDates.push(formatDateYMD(new Date(d)));
    }

    // Récupère tous les statuts de l'utilisateur pour le mois
    const statuses = await this.getStatuses();

    const rates: Record<string, number> = {};
    for (const date of allDates) {
      // Détermine les routines actives pour cette date (exclut les sautées)
      const activeRoutines = getActiveRoutinesAtDate(routines, statuses, date);
      if (activeRoutines.length === 0) continue;
      // Compte les routines complétées pour cette date
      const completedCount = activeRoutines.filter((routine) => {
        const status = statuses.find(
          (s) => s.routineId === routine.id && s.date === date
        );
        return status && status.completed;
      }).length;
      rates[date] = Math.round((completedCount / activeRoutines.length) * 100);
    }
    return rates;
  },

  async getCompletionRatesForWeek(
    startDate: string,
    endDate: string
  ): Promise<Record<string, number>> {
    const routines = await this.getRoutines();
    if (routines.length === 0) return {};

    // Récupère toutes les dates de la semaine
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allDates: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      allDates.push(formatDateYMD(new Date(d)));
    }

    // Récupère tous les statuts de l'utilisateur pour la semaine
    const statuses = await this.getStatuses();

    const rates: Record<string, number> = {};
    for (const date of allDates) {
      // Détermine les routines actives pour cette date (exclut les sautées)
      const activeRoutines = getActiveRoutinesAtDate(routines, statuses, date);
      if (activeRoutines.length === 0) continue;
      // Compte les routines complétées pour cette date
      const completedCount = activeRoutines.filter((routine) => {
        const status = statuses.find(
          (s) => s.routineId === routine.id && s.date === date
        );
        return status && status.completed;
      }).length;
      rates[date] = Math.round((completedCount / activeRoutines.length) * 100);
    }
    return rates;
  },

  async getStatusesForDate(date: string): Promise<RoutineStatus[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
      routineId: row.routine_id,
      date: row.date,
      completed: row.status === "completed",
      completedAt: row.status === "completed" ? row.created_at : undefined,
      skipped: row.status === "skipped",
    }));
  },
};

export const getTodayString = (): string => {
  return new Date().toISOString().split("T")[0];
};

// État du timer — peut rester en localStorage car c'est temporaire/donné de session
interface TimerState {
  routineId: string;
  timeLeft: number;
  isRunning: boolean;
  lastUpdate: number;
  savedDate: string;
}

const TIMER_STATE_KEY = "active-timer-state";

export const timerStorage = {
  getTimerState: (routineId: string): TimerState | null => {
    const data = localStorage.getItem(`${TIMER_STATE_KEY}-${routineId}`);
    if (!data) return null;

    const state: TimerState = JSON.parse(data);
    const today = new Date().toISOString().split("T")[0];

    if (state.savedDate !== today) {
      timerStorage.clearTimerState(routineId);
      return null;
    }

    // Si le timer était en cours, on recalcule le temps écoulé
    if (state.isRunning) {
      const elapsed = Math.floor((Date.now() - state.lastUpdate) / 1000);
      state.timeLeft = Math.max(0, state.timeLeft - elapsed);
      if (state.timeLeft === 0) {
        state.isRunning = false;
      }
    }

    return state;
  },

  saveTimerState: (state: TimerState) => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(
      `${TIMER_STATE_KEY}-${state.routineId}`,
      JSON.stringify({ ...state, lastUpdate: Date.now(), savedDate: today })
    );
  },

  clearTimerState: (routineId: string) => {
    localStorage.removeItem(`${TIMER_STATE_KEY}-${routineId}`);
  },
};
