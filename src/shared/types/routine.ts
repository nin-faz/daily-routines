export enum RoutineFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly'
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday'
}

export enum TimeOfDay {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening'
}

export interface Routine {
  id: string;
  userId: string;
  title: string;
  duration?: number;
  hasTimer: boolean;
  notificationTime?: string; // HH:MM format
  timeOfDay?: TimeOfDay;
  frequency: RoutineFrequency;
  weekDays?: DayOfWeek[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineStatus {
  id: string;
  routineId: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  completedAt?: string;
  skipped: boolean;
  createdAt: string;
}
