import { useState, useEffect } from "react";
import { useStats } from "@/application/hooks/useStats";
import { Sparkles, X } from "lucide-react";

const NewStreakRecordCard = () => {
  const [closedBanner, setClosedBanner] = useState(false);

  const [storedRecord] = useState(() =>
    parseInt(localStorage.getItem("streak-record") || "0", 10),
  );
  const [bannerDisplayed] = useState(
    () => localStorage.getItem("streak-record-displayed") === "true",
  );

  const { currentStreak } = useStats();

  const isNewRecord =
    currentStreak > 1 && currentStreak > storedRecord && !bannerDisplayed;

  useEffect(() => {
    // Met à jour le record all-time dès que le streak dépasse
    if (currentStreak > storedRecord) {
      localStorage.setItem("streak-record", String(currentStreak));
    }
    // Reset du flag bannerDisplayed quand le streak casse (retombe à 0)
    if (currentStreak === 0) {
      localStorage.removeItem("streak-record-displayed");
    }
  }, [currentStreak, storedRecord]);

  useEffect(() => {
    // Marque "bannière déjà montrée pour ce record" sans toucher au state (évite de cacher la bannière immédiatement)
    if (isNewRecord) {
      localStorage.setItem("streak-record-displayed", "true");
    }
  }, [isNewRecord]);

  if (closedBanner || !isNewRecord) return null;

  const handleClosedBanner = () => setClosedBanner(true);

  return (
    <>
      <style>{`
        @keyframes pop {
          0%   { transform: scale(1.35); opacity: 0; filter: brightness(1.4); }
          55%  { transform: scale(0.96); opacity: 1; filter: brightness(1.1); }
          75%  { transform: scale(1.03); filter: brightness(1); }
          90%  { transform: scale(0.99); }
          100% { transform: scale(1);   filter: brightness(1); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(300%)  skewX(-15deg); }
        }
        @keyframes trophy {
          0%, 100% { transform: translateY(0)   scale(1)    rotate(0deg); }
          20%      { transform: translateY(-5px) scale(1.15) rotate(-8deg); }
          40%      { transform: translateY(-3px) scale(1.1)  rotate(6deg); }
          60%      { transform: translateY(-5px) scale(1.12) rotate(-4deg); }
          80%      { transform: translateY(-2px) scale(1.05) rotate(3deg); }
        }
        @keyframes float-a {
          0%, 100% { transform: translateY(0)   scale(1);   opacity: 0.5; }
          50%      { transform: translateY(-7px) scale(1.2); opacity: 1;   }
        }
        @keyframes float-b {
          0%, 100% { transform: translateY(0)   scale(0.9); opacity: 0.4; }
          50%      { transform: translateY(-5px) scale(1.1); opacity: 0.9; }
        }
        @keyframes float-c {
          0%, 100% { transform: translateY(0)   scale(1.1); opacity: 0.6; }
          50%      { transform: translateY(-8px) scale(0.9); opacity: 1;   }
        }
        .wrapper { animation: pop     0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .shimmer  { animation: shimmer 2.8s ease-in-out infinite 0.7s; }
        .trophy   { animation: trophy  2.4s ease-in-out infinite; }
        .float-a  { animation: float-a 2.6s ease-in-out infinite; }
        .float-b  { animation: float-b 3.1s ease-in-out infinite 0.4s; }
        .float-c  { animation: float-c 2.9s ease-in-out infinite 0.9s; }
      `}</style>

      <div className="wrapper">
        <div
          role="status"
          className="relative overflow-hidden rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-950/70 via-amber-900/50 to-orange-950/60 px-5 py-4 transition-all duration-200 hover:brightness-[1.08] hover:scale-[1.005]"
        >
          <div className="shimmer pointer-events-none absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-yellow-300/15 to-transparent" />

          <span
            className="float-a pointer-events-none absolute right-14 top-2 text-yellow-300 text-xs select-none"
            aria-hidden="true"
          >
            ✦
          </span>
          <span
            className="float-b pointer-events-none absolute right-8  top-5 text-amber-300 text-[10px] select-none"
            aria-hidden="true"
          >
            ★
          </span>
          <span
            className="float-c pointer-events-none absolute right-20 top-6 text-yellow-200 text-[8px] select-none"
            aria-hidden="true"
          >
            ✦
          </span>

          <div className="flex items-center gap-4">
            <span
              className="trophy inline-block text-3xl select-none"
              aria-hidden="true"
            >
              🏆
            </span>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent leading-tight">
                Nouveau record personnel !
              </p>
              <p className="text-xs text-yellow-200/70 mt-0.5 flex items-center gap-1">
                <Sparkles
                  className="h-3 w-3 text-yellow-400/60"
                  aria-hidden="true"
                />
                {currentStreak} jours d'affilée — tu déchires 🔥
              </p>
            </div>

            <button
              onClick={handleClosedBanner}
              aria-label="Fermer le message"
              className="shrink-0 rounded-lg p-1.5 text-yellow-400/50 hover:text-yellow-300 hover:bg-yellow-400/15 transition-all duration-200"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewStreakRecordCard;
