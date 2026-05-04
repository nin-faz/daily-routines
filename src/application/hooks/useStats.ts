import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { routineStorage } from "@/data/repositories/routines";
import { folderStorage } from "@/data/repositories/folders";
import { taskStorage } from "@/data/repositories/tasks";
import { freezeStorage } from "@/data/repositories/freeze";
import { computeStreaks, computeLastNDaysStatus, getRoutineDateRange, type DayStatus } from "@/application/services/statsService";

export const useStats = () => {
  const { data: routines = [], isLoading: isLoadingRoutines } = useQuery({
    queryKey: ["routines"],
    queryFn: () => routineStorage.getRoutines(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const { data: statuses = [], isLoading: isLoadingStatuses } = useQuery({
    queryKey: ["routine-statuses"],
    queryFn: () => routineStorage.getStatuses(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const { data: folders = [], isLoading: isLoadingFolders } = useQuery({
    queryKey: ["folders"],
    queryFn: () => folderStorage.getFolders(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => taskStorage.getTasks(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  const { data: freezeUsedAt } = useQuery({
    queryKey: ["streak-freeze"],
    queryFn: () => freezeStorage.getStreakFreezeUsedAt(),
    staleTime: 1000 * 60 * 5,
  });

  const activeRoutines = useMemo(() => routines.filter(r => !r.isArchived), [routines]);

  const allDates = useMemo(() => getRoutineDateRange(activeRoutines, new Date()), [activeRoutines]);

  const freezeDates = useMemo(
    () => (freezeUsedAt ? [freezeUsedAt] : []),
    [freezeUsedAt],
  );

  const { currentStreak, recordStreak } = useMemo(
    () => computeStreaks(activeRoutines, statuses, allDates, freezeDates),
    [activeRoutines, statuses, allDates, freezeDates],
  );

  const lastDaysStatus: DayStatus[] = useMemo(
    () => computeLastNDaysStatus(activeRoutines, statuses, new Date().toISOString().slice(0, 10), 5),
    [activeRoutines, statuses],
  );

  return {
    routines,
    statuses,
    folders,
    tasks,
    currentStreak,
    recordStreak,
    lastDaysStatus,
    isLoading: isLoadingRoutines || isLoadingStatuses || isLoadingFolders || isLoadingTasks,
  };
};
