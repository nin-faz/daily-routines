/**
 * @file repositories/timer.ts
 * @description Persistance de l'état du timer via localStorage.
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
  getTimerState: (routineId: string): TimerState | null => {
    const data = localStorage.getItem(`${TIMER_STATE_KEY}-${routineId}`);
    if (!data) return null;

    const state: TimerState = JSON.parse(data);
    const today = new Date().toISOString().split("T")[0];

    if (state.savedDate !== today) {
      timerStorage.clearTimerState(routineId);
      return null;
    }

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
