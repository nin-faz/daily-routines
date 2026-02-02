import { useState, useEffect } from "react";
import { Routine, RoutineStatus } from "@/types/routine";
import { routineStorage } from "@/integrations/supabase/routines";
import CalendarHeatmap from "@/components/stats/CalendarHeatmap";
import { WeeklyView } from "@/components/stats/WeeklyView";
import DayRoutinesList from "@/components/routine/DayRoutinesList";
import DayDeadlinesList from "@/components/project/DayDeadlinesList";
import Navigation from "@/components/layout/Navigation";
import Header from "@/components/layout/Header";
import { Sparkles, Calendar as CalendarIcon, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateYMD } from "@/lib/date";

type ViewMode = "monthly" | "weekly";

const Calendar = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");

  useEffect(() => {
    const loadRoutines = async () => {
      const loadedRoutines = await routineStorage.getRoutines();
      setRoutines(loadedRoutines);
    };
    loadRoutines();
  }, []);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const [statusesForDate, setStatusesForDate] = useState<RoutineStatus[]>([]);

  useEffect(() => {
    const loadStatuses = async () => {
      const dateString = formatDateYMD(selectedDate);
      const statuses = await routineStorage.getStatusesForDate(dateString);
      setStatusesForDate(statuses);
    };
    loadStatuses();
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-gradient-bg pb-20 md:pb-24">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-3xl">
        <header className="mb-6 sm:mb-8">
          <Header />
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Calendrier
            </h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground text-center">
            Visualisez vos progrès au fil du temps
          </p>
        </header>

        <div className="flex justify-center gap-2 mb-6">
          <Button
            variant={viewMode === "monthly" ? "default" : "outline"}
            onClick={() => setViewMode("monthly")}
            size="sm"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Mensuel
          </Button>
          <Button
            variant={viewMode === "weekly" ? "default" : "outline"}
            onClick={() => setViewMode("weekly")}
            size="sm"
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Hebdomadaire
          </Button>
        </div>

        <main className="space-y-6">
          {viewMode === "monthly" ? (
            <CalendarHeatmap onDateSelect={handleDateSelect} />
          ) : (
            <WeeklyView
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          )}
          <DayDeadlinesList date={selectedDate} />
          <DayRoutinesList
            routines={routines}
            statuses={statusesForDate}
            date={selectedDate}
          />
        </main>
      </div>

      <Navigation />
    </div>
  );
};

export default Calendar;
