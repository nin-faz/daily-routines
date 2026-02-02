export interface Routine {
  id: string;
  title: string;
  duration?: number;
  hasTimer: boolean;
  notificationTime?: string; // HH:MM format
  timeOfDay?: TimeOfDay;
  createdAt: string;
}

export enum TimeOfDay {
  Morning = 'morning',
  Afternoon = 'afternoon',
  Evening = 'evening',
}

export interface RoutineStatus {
  routineId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  completedAt?: string;
  skipped?: boolean;
}
