import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, RotateCcw } from "lucide-react";
import { routineStorage, timerStorage } from "@/integrations/supabase/routines";
import { Routine } from "@/types/routine";

const TimerView = () => {
  const { routineId } = useParams();
  const navigate = useNavigate();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Initialize from saved state
  const savedState = routineId ? timerStorage.getTimerState(routineId) : null;
  const [timeLeft, setTimeLeft] = useState(savedState?.timeLeft ?? 0);
  const [isRunning, setIsRunning] = useState(savedState?.isRunning ?? true);

  useEffect(() => {
    const loadRoutine = async () => {
      const routines = await routineStorage.getRoutines();
      const found = routines.find((r) => r.id === routineId);
      if (found && found.duration) {
        setRoutine(found);
        // Only set initial time if no saved state
        if (!savedState) {
          setTimeLeft(found.duration * 60);
        }
      } else {
        navigate("/");
      }
    };
    loadRoutine();
  }, [routineId, navigate]);

  // Save timer state whenever it changes
  useEffect(() => {
    if (routineId) {
      timerStorage.saveTimerState({
        routineId,
        timeLeft,
        isRunning,
        lastUpdate: Date.now(),
        savedDate: new Date().toISOString().split("T")[0],
      });
    }
  }, [routineId, timeLeft, isRunning]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (routineId) {
              timerStorage.clearTimerState(routineId);
            }
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, routineId]);

  const playCompletionSound = () => {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleReset = () => {
    setIsRunning(false);
    if (routine?.duration) {
      setTimeLeft(routine.duration * 60);
      if (routineId) {
        timerStorage.clearTimerState(routineId);
      }
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleClose = () => {
    navigate("/");
  };

  if (!routine) return null;

  const progress = routine.duration
    ? ((routine.duration * 60 - timeLeft) / (routine.duration * 60)) * 100
    : 0;
  const isComplete = timeLeft === 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="absolute top-4 right-4"
      >
        <X className="h-6 w-6" />
      </Button>

      <div className="flex flex-col items-center gap-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-foreground text-center">
          {routine.title}
        </h1>

        <div className="relative">
          <svg className="w-80 h-80 transform -rotate-90">
            <circle
              cx="160"
              cy="160"
              r="140"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="160"
              cy="160"
              r="140"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 140}`}
              strokeDashoffset={`${2 * Math.PI * 140 * (1 - progress / 100)}`}
              className="text-primary transition-all duration-1000"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-bold text-foreground">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {isComplete && (
          <div className="text-2xl font-semibold text-primary animate-fade-in">
            ✨ Terminé !
          </div>
        )}

        <div className="flex gap-4">
          <Button
            size="lg"
            onClick={toggleTimer}
            className="h-16 w-16 rounded-full"
            disabled={isComplete}
          >
            {isRunning ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8" />
            )}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleReset}
            className="h-16 w-16 rounded-full"
          >
            <RotateCcw className="h-8 w-8" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TimerView;
