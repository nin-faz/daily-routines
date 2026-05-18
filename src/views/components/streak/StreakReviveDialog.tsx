import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Lottie from "lottie-react";
import eggBrokenAnimation from "@/assets/animations/egg-broken.json";
import phoenixAnimation from "@/assets/animations/phoenix.json";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useStreakRevive } from "@/application/hooks/useStreakRevive";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";

const SPARKS = ["🔥", "✨", "💫", "🌟", "🔥", "✨", "💫"];
const N = 30;

type Spark = {
  id: number;
  emoji: string;
  angle: number;
  dist: number;
  size: number;
  dur: number;
  delay: number;
};
const makeSparks = (): Spark[] =>
  Array.from({ length: N }, (_, i) => ({
    id: i,
    emoji: SPARKS[i % SPARKS.length],
    angle: (360 / N) * i + Math.random() * 15 - 7,
    dist: 100 + Math.random() * 200,
    size: 18 + Math.random() * 22,
    dur: 700 + Math.random() * 500,
    delay: Math.random() * 100,
  }));

const Particles = ({ onDone }: { onDone: () => void }) => {
  const [sparks] = useState(makeSparks);
  const ref = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    ref.current = setTimeout(onDone, 1400);
    return () => clearTimeout(ref.current);
  }, [onDone]);

  return createPortal(
    <>
      <style>{`
        @keyframes rv-fly {
          0%   { transform: translate(0,0) scale(1) rotate(0deg); opacity:1; }
          80%  { opacity:1; }
          100% { transform: translate(var(--tx),var(--ty)) scale(0.2) rotate(var(--rot)); opacity:0; }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        {sparks.map((f) => {
          const rad = (f.angle * Math.PI) / 180;
          return (
            <span
              key={f.id}
              style={
                {
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  fontSize: f.size,
                  "--tx": `${Math.cos(rad) * f.dist}px`,
                  "--ty": `${Math.sin(rad) * f.dist}px`,
                  "--rot": `${Math.random() * 720 - 360}deg`,
                  animation: `rv-fly ${f.dur}ms ${f.delay}ms cubic-bezier(0.15,0.8,0.35,1) both`,
                  pointerEvents: "none",
                } as React.CSSProperties
              }
            >
              {f.emoji}
            </span>
          );
        })}
      </div>
    </>,
    document.body,
  );
};

const ReviveAnimModal = ({
  open,
  onClose,
  currentStreak,
}: {
  open: boolean;
  onClose: () => void;
  currentStreak: number;
}) => {
  const [phase, setPhase] = useState<
    "egg" | "explode" | "phoenix" | "finale" | "done"
  >("egg");

  useEffect(() => {
    if (open) setPhase("egg");
  }, [open]);

  useEffect(() => {
    if (phase === "done") onClose();
  }, [phase, onClose]);

  return (
    <>
      <Dialog
        open={
          open && (phase === "egg" || phase === "phoenix" || phase === "finale")
        }
        onOpenChange={(o) => !o && onClose()}
      >
        <DialogContent className="max-w-[280px] text-center flex flex-col items-center gap-2 p-8 border-orange-500/20 bg-background/95 backdrop-blur-sm shadow-2xl">
          <DialogTitle className="sr-only">Éveil activé !</DialogTitle>
          {phase === "egg" && (
            <Lottie
              animationData={eggBrokenAnimation}
              loop={false}
              onComplete={() => setPhase("explode")}
              className="w-52 h-52"
            />
          )}
          {(phase === "phoenix" || phase === "finale") && (
            <>
              <Lottie
                animationData={phoenixAnimation}
                loop={false}
                onComplete={() => setPhase("finale")}
                className="w-52 h-52"
              />
              <p
                className="text-base font-bold"
                style={{ color: "hsl(35,95%,70%)" }}
              >
                Streak relancé 🐦‍🔥
              </p>
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">
                  {currentStreak} jours
                </strong>{" "}
                sauvegardés
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
      {phase === "explode" && <Particles onDone={() => setPhase("phoenix")} />}
      {phase === "finale" && <Particles onDone={() => setPhase("done")} />}
    </>
  );
};

interface StreakReviveCardProps {
  currentStreak: number;
  streakToSave: number;
  streakAtRisk?: boolean;
  reviveDate?: string;
}

const StreakReviveCard = ({
  currentStreak,
  streakToSave,
  streakAtRisk = false,
  reviveDate,
}: StreakReviveCardProps) => {
  const { reviveAvailable, isActivating, nextRechargeLabel, activateRevive } =
    useStreakRevive();
  const [showAnim, setShowAnim] = useState(false);

  const handleConfirm = () => {
    activateRevive(
      {
        date: reviveDate ?? new Date().toISOString().slice(0, 10),
        streak: streakToSave,
      },
      { onSuccess: () => setShowAnim(true) },
    );
  };

  const isRetroactive = streakAtRisk && currentStreak === 0;
  const showActivateButton = reviveAvailable && streakAtRisk;

  return (
    <>
      <div
        style={{
          background:
            streakAtRisk && reviveAvailable
              ? "linear-gradient(135deg, hsl(45,60%,10%), hsl(20,15%,14%))"
              : reviveAvailable
                ? "linear-gradient(135deg, hsl(35,60%,12%), hsl(20,15%,14%))"
                : "hsl(35,30%,12%)",
          border: `1px solid ${
            streakAtRisk && reviveAvailable
              ? "hsl(45,70%,28%)"
              : reviveAvailable
                ? "hsl(35,60%,28%)"
                : "hsl(35,30%,22%)"
          }`,
          opacity: !reviveAvailable && !streakAtRisk ? 0.7 : 1,
        }}
        className="rounded-2xl px-5 py-4 flex items-center gap-4 transition-all duration-200 hover:brightness-[1.08] hover:scale-[1.005]"
      >
        <>
          <style>{`
            @keyframes egg-wobble {
              0%,100% { transform: rotate(0deg) translateX(0); }
              10%     { transform: rotate(-8deg) translateX(-1px); }
              25%     { transform: rotate(8deg) translateX(1px); }
              40%     { transform: rotate(-5deg) translateX(-1px); }
              55%     { transform: rotate(5deg) translateX(1px); }
              70%     { transform: rotate(-3deg); }
              85%     { transform: rotate(3deg); }
            }
          `}</style>
          {isRetroactive && reviveAvailable ? (
            <div
              style={{
                position: "relative",
                display: "inline-block",
                animation: "egg-wobble 1.1s ease-in-out infinite",
              }}
              aria-hidden="true"
            >
              <span className="text-3xl select-none shrink-0">🥚</span>
              <svg
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
                viewBox="0 0 36 36"
              >
                <path
                  d="M20 6 L17 11 L20 14 L16 20"
                  stroke="rgba(0,0,0,0.45)"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#crack-shadow)"
                />
                <defs>
                  <filter id="crack-shadow">
                    <feDropShadow
                      dx="0"
                      dy="0"
                      stdDeviation="0.5"
                      floodColor="rgba(0,0,0,0.3)"
                    />
                  </filter>
                </defs>
              </svg>
            </div>
          ) : reviveAvailable ? (
            <span className="text-3xl select-none shrink-0" aria-hidden="true">
              🪺
            </span>
          ) : (
            <div
              style={{ position: "relative", display: "inline-block" }}
              aria-hidden="true"
            >
              <style>{`
                @keyframes phoenix-hover {
                  0%, 100% { transform: translateY(0) scale(1); }
                  50%       { transform: translateY(-4px) scale(1.06); }
                }
                @keyframes phoenix-glow {
                  0%, 100% { opacity: 0.3; transform: scale(1); }
                  50%       { opacity: 0.65; transform: scale(1.15); }
                }
              `}</style>
              <div
                style={{
                  position: "absolute",
                  inset: -6,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle, hsl(35,95%,60%) 0%, transparent 70%)",
                  animation: "phoenix-glow 2s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
              <span
                className="text-3xl select-none shrink-0"
                style={{
                  display: "inline-block",
                  animation: "phoenix-hover 2s ease-in-out infinite",
                }}
              >
                🐦‍🔥
              </span>
            </div>
          )}
        </>

        <div className="flex-1 min-w-0">
          {reviveAvailable ? (
            <>
              <p
                className="text-sm font-semibold leading-tight mb-0.5"
                style={{
                  color: streakAtRisk ? "hsl(45,95%,70%)" : "hsl(35,95%,70%)",
                }}
              >
                {isRetroactive
                  ? "Streak cassé hier ⚠️"
                  : streakAtRisk
                    ? "Ton streak est en danger ⚠️"
                    : "Éveil disponible"}
              </p>
              <p className="text-xs text-muted-foreground leading-snug">
                {isRetroactive ? (
                  "Utilise ton éveil pour récupérer ton streak d'hier"
                ) : streakAtRisk ? (
                  <>
                    {" "}
                    Utilise ton éveil pour protéger tes{" "}
                    <strong style={{ color: "hsl(45,95%,65%)" }}>
                      {currentStreak} jours
                    </strong>
                  </>
                ) : (
                  "1 éveil disponible cette semaine · se recharge chaque lundi"
                )}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-muted-foreground leading-tight mb-0.5">
                Éveil utilisé
              </p>
              <p className="text-xs text-muted-foreground">
                Recharge le {nextRechargeLabel}
              </p>
            </>
          )}
        </div>

        {!reviveAvailable && !streakAtRisk && (
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 whitespace-nowrap"
            style={{ background: "hsl(35,20%,18%)", color: "hsl(30,10%,55%)" }}
          >
            Utilisé
          </span>
        )}

        {showActivateButton && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                className="shrink-0 font-bold text-xs whitespace-nowrap"
                style={{
                  background: "hsl(35,95%,60%)",
                  color: "hsl(20,15%,10%)",
                }}
                disabled={isActivating}
              >
                Ranimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  <span
                    style={{
                      position: "relative",
                      display: "inline-block",
                      animation: "egg-wobble 1.1s ease-in-out infinite",
                      marginRight: 6,
                    }}
                  >
                    🥚
                    <svg
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                      }}
                      viewBox="0 0 36 36"
                    >
                      <path
                        d="M20 6 L17 11 L20 14 L16 20"
                        stroke="rgba(0,0,0,0.45)"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#crack-shadow)"
                      />
                      <defs>
                        <filter id="crack-shadow">
                          <feDropShadow
                            dx="0"
                            dy="0"
                            stdDeviation="0.5"
                            floodColor="rgba(0,0,0,0.3)"
                          />
                        </filter>
                      </defs>
                    </svg>
                  </span>
                  Ranimer ton streak ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isRetroactive ? (
                    <>
                      Ton éveil va couvrir hier et restaurer ton streak. Tu
                      disposes d'<strong>1 éveil par semaine</strong> — il se
                      rechargera lundi prochain.
                    </>
                  ) : (
                    <>
                      Ton streak de <strong>{currentStreak} jours</strong> sera
                      protégé pour aujourd'hui. Tu disposes d'
                      <strong>1 éveil par semaine</strong> — il se rechargera
                      lundi prochain.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirm}>
                  {isRetroactive
                    ? "Oui, ranimer mon streak"
                    : "Oui, protéger mon streak"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <ReviveAnimModal
        open={showAnim}
        onClose={() => setShowAnim(false)}
        currentStreak={streakToSave}
      />
    </>
  );
};

export default StreakReviveCard;
