import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  freezeStorage,
  type StreakFreezeEntry,
} from "@/data/repositories/freeze";
import {
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  parseISO,
  addWeeks,
} from "date-fns";

// Retourne true si la date appartient à la semaine courante (lundi–dimanche).
// weekStartsOn: 1 = semaine qui commence le lundi (standard européen).
// Le freeze se recharge chaque lundi matin.
function isCurrentWeek(dateStr: string): boolean {
  const today = new Date();
  return isWithinInterval(parseISO(dateStr), {
    start: startOfWeek(today, { weekStartsOn: 1 }),
    end: endOfWeek(today, { weekStartsOn: 1 }),
  });
}

// Retourne le lundi suivant formaté en français (ex: "19 mai").
// startOfWeek → lundi de cette semaine, addWeeks(..., 1) → lundi d'après.
function getNextMonday(): string {
  const nextMonday = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1);
  return nextMonday.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}

export const useStreakFreeze = () => {
  const queryClient = useQueryClient();

  const { data: freezeEntry } = useQuery({
    queryKey: ["streak-freeze"],
    queryFn: () => freezeStorage.getLastStreakFreeze(),
    staleTime: 1000 * 60 * 5,
  });

  // freezeAvailable : true si aucun freeze utilisé cette semaine
  const freezeAvailable = !freezeEntry || !isCurrentWeek(freezeEntry.date);

  // activateFreeze : prend la date à couvrir + le streak à sauvegarder.
  // streak = currentStreak si préventif, prevStreak si rétroactif.
  const { mutate: activateFreeze, isPending } = useMutation({
    mutationFn: ({ date, streak }: StreakFreezeEntry) =>
      freezeStorage.saveLastStreakFreeze(date, streak),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streak-freeze"] });
    },
  });

  return {
    freezeAvailable,
    freezeEntry: freezeEntry ?? null,
    activateFreeze,
    isActivating: isPending,
    nextRechargeLabel: freezeAvailable ? null : getNextMonday(),
  };
};
