/**
 * @file timerStorage.ts
 * @description Gestion de l'état du minuteur de routine via localStorage.
 * Ce fichier est une infrastructure pure : il gère le stockage local et rien d'autre.
 */

interface TimerState {
  routineId: string;
  timeLeft: number;
  isRunning: boolean;
  lastUpdate: number;
  savedDate: string;
}

const TIMER_STATE_KEY = "active-timer-state";

export const timerStorage = {
  /**
   * Récupère l'état du minuteur pour une routine donnée depuis localStorage.
   * Gère la réinitialisation si la date a changé ou le recalcule si le timer était en cours.
   *
   * @param routineId - L'ID de la routine
   * @returns L'état du minuteur ou null si non trouvé ou invalide
   */
  getTimerState: (routineId: string): TimerState | null => {
    const data = localStorage.getItem(`${TIMER_STATE_KEY}-${routineId}`);
    if (!data) return null;

    const state: TimerState = JSON.parse(data);
    const today = new Date().toISOString().split("T")[0];

    // Si la date sauvegardée n'est pas celle d'aujourd'hui, on réinitialise le timer
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

  /**
   * Sauvegarde l'état actuel du minuteur dans localStorage.
   *
   * @param state - L'état du minuteur à sauvegarder
   */
  saveTimerState: (state: TimerState) => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(
      `${TIMER_STATE_KEY}-${state.routineId}`,
      JSON.stringify({ ...state, lastUpdate: Date.now(), savedDate: today })
    );
  },

  /**
   * Supprime l'état du minuteur pour une routine donnée de localStorage.
   *
   * @param routineId - L'ID de la routine
   */
  clearTimerState: (routineId: string) => {
    localStorage.removeItem(`${TIMER_STATE_KEY}-${routineId}`);
  },
};
