import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { freezeStorage } from "@/data/repositories/freeze";
import { getTodayString } from "@/shared/lib/date";

function isCurrentWeek(dateStr: string): boolean {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return date >= monday && date <= sunday;
}

function getNextMonday(): string {
  const today = new Date();
  const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysUntilMonday);
  return monday.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export const useStreakFreeze = () => {
  const queryClient = useQueryClient();

  const { data: freezeUsedAt } = useQuery({
    queryKey: ["streak-freeze"],
    queryFn: () => freezeStorage.getStreakFreezeUsedAt(),
    staleTime: 1000 * 60 * 5,
  });

  const freezeAvailable =
    !freezeUsedAt || !isCurrentWeek(freezeUsedAt);

  const freezeDates: string[] = freezeUsedAt ? [freezeUsedAt] : [];

  const { mutate: activateFreeze, isPending } = useMutation({
    mutationFn: () => freezeStorage.saveStreakFreezeUsedAt(getTodayString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streak-freeze"] });
    },
  });

  return {
    freezeAvailable,
    freezeUsedAt,
    freezeDates,
    activateFreeze,
    isActivating: isPending,
    nextRechargeLabel: freezeAvailable ? null : getNextMonday(),
  };
};
