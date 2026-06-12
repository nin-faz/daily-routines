import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Square, RotateCcw, Play, Pause } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { routineStorage } from "@/data/repositories/routines";
import { timerStorage } from "@/data/repositories/timer";
import { Routine } from "@/shared/types/routine";
import { usePageTitle } from "@/application/hooks/usePageTitle";

const TimerView = () => {
  usePageTitle("Timer");
  const { routineId } = useParams();
  const navigate = useNavigate();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const savedState = routineId ? timerStorage.getTimerState(routineId) : null;
  const [timeLeft, setTimeLeft] = useState(savedState?.timeLeft ?? 0);
  const [isRunning, setIsRunning] = useState(savedState?.isRunning ?? true);
  const hasStartedRef = useRef(savedState !== null);

  const today = new Date().toISOString().slice(0, 10);

  // Resync when returning from background
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && routineId) {
        const saved = timerStorage.getTimerState(routineId);
        if (saved) {
          setTimeLeft(saved.timeLeft);
          setIsRunning(saved.isRunning);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [routineId]);

  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }
    };
    document.addEventListener("touchstart", initAudio, { once: true });
    document.addEventListener("click", initAudio, { once: true });
    return () => {
      document.removeEventListener("touchstart", initAudio);
      document.removeEventListener("click", initAudio);
    };
  }, []);

  useEffect(() => {
    const loadRoutine = async () => {
      const routines = await routineStorage.getRoutines();
      const found = routines.find((r) => r.id === routineId);
      if (found && found.duration) {
        setRoutine(found);
        if (!savedState) setTimeLeft(found.duration * 60);
      } else {
        navigate("/dashboard");
      }
    };
    loadRoutine();
  }, [routineId, navigate]);

  useEffect(() => {
    if (isRunning) hasStartedRef.current = true;
    if (!routineId || !hasStartedRef.current) return;
    timerStorage.saveTimerState({
      routineId,
      timeLeft,
      isRunning,
      lastUpdate: Date.now(),
      savedDate: today,
    });
  }, [routineId, timeLeft, isRunning]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (routineId) timerStorage.clearTimerState(routineId);
            playCompletionSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, routineId]);

  const playCompletionSound = () => {
    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
    try {
      const audioContext =
        audioContextRef.current ||
        new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 880;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      oscillator2.frequency.value = 660;
      oscillator2.type = "sine";
      gainNode2.gain.setValueAtTime(0.5, audioContext.currentTime + 0.15);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.95);
      oscillator2.start(audioContext.currentTime + 0.15);
      oscillator2.stop(audioContext.currentTime + 0.95);
    } catch (error) {
      console.log("Audio context not available:", error);
    }
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("⏰ Timer terminé !", {
        body: `La routine "${routine?.title}" est terminée`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "timer-complete",
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStop = () => {
    setIsRunning(false);
    if (routineId) timerStorage.clearTimerState(routineId);
    navigate(-1);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (routine?.duration) setTimeLeft(routine.duration * 60);
    if (routineId) timerStorage.clearTimerState(routineId);
    hasStartedRef.current = false;
  };

  if (!routine) return null;

  const totalSeconds = (routine.duration ?? 0) * 60;
  const remaining = totalSeconds > 0 ? timeLeft / totalSeconds : 1;
  const progressPct = Math.round((1 - remaining) * 100);
  const isComplete = timeLeft === 0;

  const R = 120;
  const circumference = 2 * Math.PI * R;
  const strokeDashoffset = circumference * (1 - remaining);

  const formatLinear = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Retour
          </Button>
        </div>

        <div className="flex flex-col items-center gap-8 pb-12">
        {/* Title */}
        <h1 className="text-2xl font-bold text-center">{routine.title}</h1>

        {/* Circle */}
        <div className="relative">
          <svg width="280" height="280" className="transform -rotate-90">
            <circle
              cx="140"
              cy="140"
              r={R}
              stroke="hsl(var(--muted))"
              strokeWidth="16"
              fill="none"
            />
            <circle
              cx="140"
              cy="140"
              r={R}
              stroke="hsl(var(--primary))"
              strokeWidth="16"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="text-5xl font-bold tabular-nums">{formatTime(timeLeft)}</span>
            <span className="text-muted-foreground text-sm">restant</span>
            <span className="text-muted-foreground/60 text-xs">sur {routine.duration} min</span>
          </div>
        </div>

        {/* Linear progress */}
        <div className="w-full space-y-1.5">
          <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>0:00</span>
            <span className="text-primary font-semibold">{progressPct}%</span>
            <span>{formatLinear(totalSeconds)}</span>
          </div>
        </div>

        {/* Status */}
        <p className="text-sm text-muted-foreground font-medium">
          {isComplete ? "✨ Session terminée !" : isRunning ? "Session en cours…" : "En pause"}
        </p>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={handleStop}
            aria-label="Arrêter et quitter"
            className="w-14 h-14 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <Square className="h-5 w-5 fill-current text-muted-foreground" aria-hidden="true" />
          </button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            disabled={isComplete}
            aria-label={isRunning ? "Pause" : "Reprendre"}
            className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {isRunning ? <Pause className="h-8 w-8" aria-hidden="true" /> : <Play className="h-8 w-8" aria-hidden="true" />}
          </button>
          <button
            onClick={handleReset}
            disabled={timeLeft === (routine?.duration ?? 0) * 60}
            aria-label="Recommencer"
            className="w-14 h-14 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors disabled:opacity-40"
          >
            <RotateCcw className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </button>
        </div>
      </div>
      </div>
    </main>
  );
};

export default TimerView;
