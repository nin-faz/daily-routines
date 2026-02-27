import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { timerStorage } from "@/integrations/supabase/timer";

interface TimerProps {
  duration: number; // in minutes
  onComplete?: () => void;
  routineId: string;
}

const Timer = ({ duration, onComplete, routineId }: TimerProps) => {
  const navigate = useNavigate();

  // Initialize from saved state or default
  const savedState = timerStorage.getTimerState(routineId);
  const [timeLeft, setTimeLeft] = useState(
    savedState?.timeLeft ?? duration * 60,
  );
  const [isRunning, setIsRunning] = useState(savedState?.isRunning ?? false);
  const intervalRef = useRef<number | null>(null);

  // Save timer state whenever it changes
  useEffect(() => {
    timerStorage.saveTimerState({
      routineId,
      timeLeft,
      isRunning,
      lastUpdate: Date.now(),
      savedDate: new Date().toISOString().split("T")[0],
    });
  }, [routineId, timeLeft, isRunning]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            timerStorage.clearTimerState(routineId);
            onComplete?.();
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
  }, [isRunning, timeLeft, onComplete, routineId]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
    timerStorage.clearTimerState(routineId);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleFullscreen = () => {
    navigate(`/timer/${routineId}`);
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <div className="flex items-center gap-1.5 bg-primary/50 rounded-full px-2 py-1">
      <div className="relative">
        <svg className="w-8 h-8 transform -rotate-90">
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 14}`}
            strokeDashoffset={`${2 * Math.PI * 14 * (1 - progress / 100)}`}
            className="text-primary transition-all duration-1000"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">
          {formatTime(timeLeft)}
        </span>
      </div>

      <div className="flex gap-0.5">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleFullscreen}
          className="h-6 w-6 p-0"
          title="Mode plein écran"
        >
          <Maximize2 className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={toggleTimer}
          className="h-6 w-6 p-0"
        >
          {isRunning ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReset}
          className="h-6 w-6 p-0"
          disabled={timeLeft === duration * 60}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default Timer;
