import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Lottie from "lottie-react";
import freezeAnimation from "@/assets/animations/freeze.json";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useStreakFreeze } from "@/application/hooks/useStreakFreeze";
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

const FLAKES = ["❄️", "❄️", "🌨️", "❄️", "✨", "❄️", "❄️"];
const N = 30;

type Flake = {
  id: number;
  emoji: string;
  angle: number;
  dist: number;
  size: number;
  dur: number;
  delay: number;
};
const makeFlakes = (): Flake[] =>
  Array.from({ length: N }, (_, i) => ({
    id: i,
    emoji: FLAKES[i % FLAKES.length],
    angle: (360 / N) * i + Math.random() * 15 - 7,
    dist: 100 + Math.random() * 200,
    size: 18 + Math.random() * 22,
    dur: 700 + Math.random() * 500,
    delay: Math.random() * 100,
  }));

const Particles = ({ onDone }: { onDone: () => void }) => {
  const [flakes] = useState(makeFlakes);
  const ref = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    ref.current = setTimeout(onDone, 1400);
    return () => clearTimeout(ref.current);
  }, [onDone]);

  return createPortal(
    <>
      <style>{`
        @keyframes fz-fly {
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
        {flakes.map((f) => {
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
                  animation: `fz-fly ${f.dur}ms ${f.delay}ms cubic-bezier(0.15,0.8,0.35,1) both`,
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

const SNOW_COUNT = 40;
type Snowflake = {
  id: number;
  x: number;
  size: number;
  dur: number;
  delay: number;
  drift: number;
};
const makeSnow = (): Snowflake[] =>
  Array.from({ length: SNOW_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: 14 + Math.random() * 18,
    dur: 2000 + Math.random() * 2000,
    delay: Math.random() * 2000,
    drift: (Math.random() - 0.5) * 60,
  }));

const SnowOverlay = ({ onDone }: { onDone: () => void }) => {
  const [fading, setFading] = useState(false);
  const [flakes] = useState(makeSnow);
  const ref = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    ref.current = setTimeout(() => setFading(true), 2800);
    return () => clearTimeout(ref.current);
  }, []);

  return createPortal(
    <>
      <style>{`
        @keyframes snow-fall {
          0%   { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) translateX(var(--drift)) rotate(360deg); opacity: 0.6; }
        }
        @keyframes snow-fade-out { from { opacity:1; } to { opacity:0; } }
      `}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          pointerEvents: "none",
          overflow: "hidden",
          animation: fading
            ? "snow-fade-out 0.8s ease-out forwards"
            : undefined,
        }}
        onAnimationEnd={onDone}
      >
        {flakes.map((f) => (
          <span
            key={f.id}
            style={
              {
                position: "absolute",
                left: `${f.x}%`,
                top: -60,
                fontSize: f.size,
                "--drift": `${f.drift}px`,
                opacity: 0,
                animation: `snow-fall ${f.dur}ms ${f.delay}ms linear infinite`,
                animationFillMode: "both",
                pointerEvents: "none",
              } as React.CSSProperties
            }
          >
            ❄️
          </span>
        ))}
      </div>
    </>,
    document.body,
  );
};

const FreezeAnimModal = ({
  open,
  onClose,
  currentStreak,
}: {
  open: boolean;
  onClose: () => void;
  currentStreak: number;
}) => {
  const [phase, setPhase] = useState<"bounce" | "explode" | "snow">("bounce");

  const handleLottieComplete = () => setPhase("explode");

  return (
    <>
      <style>{`
        @keyframes fz-bounce {
          0%   { transform: translate(0px,   0px)  scale(1); }
          12%  { transform: translate(18px, -22px) scale(1.06); }
          25%  { transform: translate(-20px, 16px) scale(0.96); }
          37%  { transform: translate(0px,   0px)  scale(1.02); }
          50%  { transform: translate(16px,  20px) scale(0.97); }
          62%  { transform: translate(-18px,-14px) scale(1.05); }
          75%  { transform: translate(0px,   0px)  scale(0.98); }
          87%  { transform: translate(20px, -18px) scale(1.04); }
          100% { transform: translate(0px,   0px)  scale(1); }
        }
        @keyframes fz-scaleup {
          0%   { transform: scale(1);   opacity: 1; }
          60%  { transform: scale(3.5); opacity: 1; }
          100% { transform: scale(0);   opacity: 0; }
        }
      `}</style>
      <Dialog
        open={open && phase !== "snow"}
        onOpenChange={(o) => !o && onClose()}
      >
        <DialogContent className="max-w-[280px] text-center flex flex-col items-center gap-2 p-8 border-sky-500/20 bg-background/95 backdrop-blur-sm shadow-2xl">
          <DialogTitle className="sr-only">Freeze activé !</DialogTitle>
          <div
            style={{
              animation:
                phase === "bounce"
                  ? "fz-bounce 0.9s ease-in-out infinite"
                  : "fz-scaleup 0.25s cubic-bezier(0.4,0,0.6,1) forwards",
            }}
          >
            <Lottie
              animationData={freezeAnimation}
              loop={false}
              speed={1.8}
              onComplete={handleLottieComplete}
              className="w-52 h-52 mix-blend-multiply dark:mix-blend-screen"
            />
          </div>
          <p
            className="text-base font-bold"
            style={{ color: "hsl(200,80%,70%)" }}
          >
            Streak protégé 🧊
          </p>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">{currentStreak} jours</strong>{" "}
            sauvegardés
          </p>
        </DialogContent>
      </Dialog>
      {phase === "explode" && <Particles onDone={() => setPhase("snow")} />}
      {phase === "snow" && <SnowOverlay onDone={onClose} />}
    </>
  );
};

interface StreakFreezeCardProps {
  currentStreak: number;
  streakAtRisk?: boolean;
}

const StreakFreezeCard = ({
  currentStreak,
  streakAtRisk = false,
}: StreakFreezeCardProps) => {
  const { freezeAvailable, isActivating, nextRechargeLabel, activateFreeze } =
    useStreakFreeze();
  const [showAnim, setShowAnim] = useState(false);

  const handleConfirm = () => {
    activateFreeze(undefined, {
      onSuccess: () => setShowAnim(true),
    });
  };

  const showActivateButton = freezeAvailable && streakAtRisk;

  return (
    <>
      <div
        style={{
          background:
            streakAtRisk && freezeAvailable
              ? "linear-gradient(135deg, hsl(45,60%,10%), hsl(20,15%,14%))"
              : freezeAvailable
                ? "linear-gradient(135deg, hsl(200,60%,12%), hsl(20,15%,14%))"
                : "hsl(200,30%,12%)",
          border: `1px solid ${
            streakAtRisk && freezeAvailable
              ? "hsl(45,70%,28%)"
              : freezeAvailable
                ? "hsl(200,60%,28%)"
                : "hsl(200,30%,22%)"
          }`,
          opacity: !freezeAvailable && !streakAtRisk ? 0.7 : 1,
        }}
        className="rounded-2xl px-5 py-4 flex items-center gap-4"
      >
        <span className="text-3xl select-none shrink-0" aria-hidden="true">
          🧊
        </span>

        <div className="flex-1 min-w-0">
          {freezeAvailable ? (
            <>
              <p
                className="text-sm font-semibold leading-tight mb-0.5"
                style={{
                  color: streakAtRisk ? "hsl(45,95%,70%)" : "hsl(200,80%,70%)",
                }}
              >
                {streakAtRisk
                  ? "Ton streak est en danger ⚠️"
                  : "Freeze disponible"}
              </p>
              <p className="text-xs text-muted-foreground leading-snug">
                {streakAtRisk ? (
                  <>
                    {" "}
                    Utilise ton freeze pour protéger tes{" "}
                    <strong style={{ color: "hsl(45,95%,65%)" }}>
                      {currentStreak} jours
                    </strong>
                  </>
                ) : (
                  "1 freeze disponible cette semaine · se recharge lundi"
                )}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-muted-foreground leading-tight mb-0.5">
                Freeze utilisé
              </p>
              <p className="text-xs text-muted-foreground">
                Recharge le {nextRechargeLabel}
              </p>
            </>
          )}
        </div>

        {!freezeAvailable && !streakAtRisk && (
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 whitespace-nowrap"
            style={{ background: "hsl(200,20%,18%)", color: "hsl(30,10%,55%)" }}
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
                  background: "hsl(200,80%,60%)",
                  color: "hsl(20,15%,10%)",
                }}
                disabled={isActivating}
              >
                Activer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>🧊 Utiliser ton freeze ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ton streak de <strong>{currentStreak} jours</strong> sera
                  protégé pour aujourd'hui. Tu disposes d'
                  <strong>1 freeze par semaine</strong> — il se rechargera lundi
                  prochain.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirm}>
                  Oui, protéger mon streak
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <FreezeAnimModal
        open={showAnim}
        onClose={() => setShowAnim(false)}
        currentStreak={currentStreak}
      />
    </>
  );
};

export default StreakFreezeCard;
