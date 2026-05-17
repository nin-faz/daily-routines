import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  reviveStorage,
  type StreakReviveEntry,
} from "@/data/repositories/revive";
import {
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  parseISO,
  addWeeks,
} from "date-fns";

// Retourne true si la date appartient à la semaine courante (lundi–dimanche).
function isCurrentWeek(dateStr: string): boolean {
  const today = new Date();
  return isWithinInterval(parseISO(dateStr), {
    start: startOfWeek(today, { weekStartsOn: 1 }),
    end: endOfWeek(today, { weekStartsOn: 1 }),
  });
}

// Retourne le lundi suivant formaté en français (ex: "19 mai").
function getNextMonday(): string {
  const nextMonday = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1);
  return nextMonday.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}

export const useStreakRevive = () => {
  const queryClient = useQueryClient();

  const { data: reviveEntry } = useQuery({
    queryKey: ["streak-revive"],
    queryFn: () => reviveStorage.getLastStreakRevive(),
    staleTime: 1000 * 60 * 5,
  });

  const reviveAvailable = !reviveEntry || !isCurrentWeek(reviveEntry.activatedAt ?? reviveEntry.date);

  const { mutate: activateRevive, isPending } = useMutation({
    mutationFn: ({ date, streak }: StreakReviveEntry) =>
      reviveStorage.saveLastStreakRevive(date, streak),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streak-revive"] });
    },
  });

  return {
    reviveAvailable,
    reviveEntry: reviveEntry ?? null,
    activateRevive,
    isActivating: isPending,
    nextRechargeLabel: reviveAvailable ? null : getNextMonday(),
  };
};
