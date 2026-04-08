import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { routineStorage } from "@/data/repositories/routines";
import { useRoutines } from "@/application/hooks/useRoutines";
import { useAuth } from "@/application/context/AuthContext";
import CalendarHeatmap from "@/views/components/calendar/CalendarHeatmap";
import { WeeklyView } from "@/views/components/calendar/WeeklyView";
import DayRoutinesList from "@/views/components/calendar/DayRoutinesList";
import DayDeadlinesList from "@/views/components/calendar/DayDeadlinesList";
import Navigation from "@/application/components/layout/Navigation";
import Header from "@/application/components/layout/Header";
import { Sparkles, Calendar as CalendarIcon, CalendarDays } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { formatDateYMD } from "@/shared/lib/date";
import { usePageTitle } from "@/application/hooks/usePageTitle";

type ViewMode = "monthly" | "weekly";

const Calendar = () => {
  usePageTitle("Calendrier");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const { user } = useAuth();

  // Routines via le hook partagé — même clé cache que le reste de l'app
  const { activeRoutines: routines } = useRoutines();

  // Statuts pour la date sélectionnée (pas forcément aujourd'hui)
  const { data: statusesForDate = [] } = useQuery({
    queryKey: ["routine-statuses", user?.id, formatDateYMD(selectedDate)],
    queryFn: () =>
      routineStorage.getStatusesForDate(formatDateYMD(selectedDate)),
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

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
