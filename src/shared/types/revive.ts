export type StreakReviveEntry = {
  date: string;          // YYYY-MM-DD : jour couvert par le revive
  streak: number;        // streak sauvegardé au moment de l'activation
  activatedAt?: string;  // YYYY-MM-DD : jour d'activation (today) — pour isCurrentWeek
};
