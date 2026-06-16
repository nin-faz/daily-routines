import { useState } from "react";
import { X } from "lucide-react";
import { useStats } from "@/application/hooks/useStats";
import { useStreakRevive } from "@/application/hooks/useStreakRevive";
import { getTodayString } from "@/shared/lib/date";
import type { DayStatus } from "@/application/services/statsService";

const DAY_LABELS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

const DotRow = ({ days }: { days: DayStatus[] }) => (
  <div className="flex items-end gap-1.5">
    {days.map((day) => {
      const isToday = day.status === "today";
      const isDone = day.status === "completed";
      const isMissed = day.status === "missed";
      const d = new Date(day.date + "T00:00:00");
      const label = isToday ? "auj." : DAY_LABELS[d.getDay()];

      return (
        <div key={day.date} className="flex flex-col items-center gap-1">
          <div
            aria-label={
              isToday ? "Aujourd'hui" : isDone ? "Complété" : "Manqué"
            }
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: isToday
                ? "transparent"
                : isDone
                  ? "hsl(142,50%,28%)"
                  : "hsl(0,55%,30%)",
              border: isToday
                ? "1.5px dashed hsl(var(--border))"
                : isDone
                  ? "1px solid hsl(142,50%,40%)"
                  : "1px solid hsl(0,55%,42%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isToday ? 6 : 11,
              fontWeight: 700,
              color: isToday
                ? "hsl(var(--muted-foreground))"
                : isDone
                  ? "hsl(142,70%,65%)"
                  : "hsl(0,70%,65%)",
              flexShrink: 0,
              boxShadow: isDone
                ? "0 0 6px hsl(142,50%,28% / 0.5)"
                : isMissed
                  ? "0 0 6px hsl(0,55%,30% / 0.4)"
                  : "none",
            }}
          >
            {isToday ? "~" : isDone ? "✓" : "✗"}
          </div>
          <span
            style={{
              fontSize: 8,
              color: "hsl(var(--muted-foreground))",
              fontWeight: 500,
            }}
          >
            {label}
          </span>
        </div>
      );
    })}
  </div>
);

const MESSAGES = [
  "Une pause ne remet pas tout à zéro.",
  "Ça arrive. L'important c'est de revenir.",
  "La régularité, c'est pas la perfection.",
  "Un jour raté n'efface pas des semaines d'efforts.",
];

const sessionKey = `broken-streak-dismissed-${getTodayString()}`;

const BrokenStreakCard = () => {
  const [closed, setClosed] = useState(
    () => !!sessionStorage.getItem(sessionKey),
  );
  const { currentStreak, lastDaysStatus, isLoading } = useStats();
  const { prevStreak: prevStreakDB } = useStreakRevive();

  const localPrevStreak = parseInt(localStorage.getItem("prev-streak") || "0", 10);
  const prevStreak = prevStreakDB > 0 ? prevStreakDB : localPrevStreak;

  const show = !isLoading && !closed && currentStreak === 0 && prevStreak > 0;

  if (!show) return null;

  const handleClose = () => {
    sessionStorage.setItem(sessionKey, "1");
    setClosed(true);
  };

  const displayStreak = prevStreak || 14;
  const message = MESSAGES[displayStreak % MESSAGES.length];

  return (
    <>
      <style>{`
        @keyframes bs-pop {
          0%   { opacity: 0; transform: scale(0.97) translateY(-4px); }
          60%  { opacity: 1; transform: scale(1.01) translateY(0); }
          100% { transform: scale(1); }
        }
        @keyframes bs-emoji {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          30%      { transform: rotate(-8deg) translateY(-2px); }
          60%      { transform: rotate(5deg) translateY(1px); }
        }
        @keyframes bs-glow {
          0%, 100% { opacity: 0.15; }
          50%      { opacity: 0.3; }
        }
        .bs-wrapper { animation: bs-pop   0.4s cubic-bezier(0.34,1.2,0.64,1) both; }
        .bs-emoji   { animation: bs-emoji 3s ease-in-out infinite 0.5s; display: inline-block; }
        .bs-glow    { animation: bs-glow  3s ease-in-out infinite; }
      `}</style>

      <div className="bs-wrapper">
        <div
          role="status"
          className="relative overflow-hidden rounded-2xl px-5 py-4 transition-all duration-200 hover:brightness-[1.08] hover:scale-[1.005]"
          style={{
            background:
              "linear-gradient(135deg, hsl(0,35%,10%) 0%, hsl(15,20%,12%) 60%, hsl(25,15%,13%) 100%)",
            border: "1px solid hsl(0,40%,20%)",
          }}
        >
          <div
            className="bs-glow pointer-events-none absolute"
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "hsl(0,60%,40%)",
              filter: "blur(40px)",
              left: -20,
              top: -20,
            }}
          />

          <div className="relative flex items-start gap-4">
            <div className="shrink-0 flex flex-col items-center gap-1.5 pt-0.5">
              <span
                className="bs-emoji text-3xl select-none"
                aria-hidden="true"
              >
                😮‍💨
              </span>
              <div
                className="rounded-xl px-2.5 py-1 text-center"
                style={{
                  background: "hsl(25,40%,14%)",
                  border: "1px solid hsl(25,40%,22%)",
                }}
              >
                <span
                  className="text-base font-black leading-none"
                  style={{ color: "hsl(25,90%,62%)" }}
                >
                  {displayStreak}
                </span>
                <span className="text-[9px] text-muted-foreground ml-1">
                  j.
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-2.5">
              <div>
                <p
                  className="text-sm font-bold leading-tight"
                  style={{ color: "hsl(0,60%,72%)" }}
                >
                  Streak cassé
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {message}
                </p>
              </div>

              {lastDaysStatus.length > 0 && <DotRow days={lastDaysStatus} />}
            </div>

            <button
              onClick={handleClose}
              aria-label="Fermer"
              className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-white/5"
              style={{ color: "hsl(0,25%,50%)" }}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BrokenStreakCard;
