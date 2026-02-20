import { useState, useEffect, useRef, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Calendar,
  FolderKanban,
  Bell,
  ChevronRight,
  ChevronLeft,
  Rocket,
} from "lucide-react";

const ONBOARDING_KEY = "onboarding_completed";

const steps: Array<{
  icon: typeof Sparkles;
  title: string;
  description: ReactNode;
}> = [
  {
    icon: Sparkles,
    title: "Bienvenue sur Mes Routines ! 🎉",
    description:
      "Votre compagnon quotidien pour développer de bonnes habitudes et gérer vos dossiers efficacement.",
  },
  {
    icon: Calendar,
    title: "Créez vos routines",
    description:
      "Ajoutez des routines pour le matin, l'après-midi ou le soir. Définissez des minuteurs et des rappels pour rester sur la bonne voie.",
  },
  {
    icon: FolderKanban,
    title: "Organisez vos tâches",
    description:
      "Classez vos tâches quand vous le souhaitez — créez des dossiers pour structurer les projets, ou laissez des tâches sans dossier pour rester flexible.",
  },
  {
    icon: Bell,
    title: "Restez notifié",
    description:
      "Activez les notifications pour ne jamais manquer une routine. L'app fonctionne même hors-ligne !",
  },
  {
    icon: Rocket,
    title: "Prêt à commencer ?",
    description: (
      <>
        Créez votre première routine en cliquant sur le{" "}
        <span className="inline-flex items-center justify-center rounded-full h-6 w-6 bg-gradient-primary text-white font-bold text- shadow-md mx-0.5">
          +
        </span>{" "}
        en bas de l'écran.{" "}
        <span className="whitespace-nowrap">Bonne productivité !</span>
      </>
    ),
  },
];

const OnboardingDialog = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const lastWheelTime = useRef(0);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Petit délai pour laisser le temps à la page de se charger
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Ignorer les touches sur les boutons ou éléments interactifs
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest('[role="button"]')) {
      return;
    }
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Seulement si on a un touchStart valide
    if (touchStartX.current === 0) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    // Seulement si on a un touchStart valide
    if (touchStartX.current === 0) return;

    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // Distance minimale pour détecter un swipe

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe vers la gauche = page suivante
        handleNext();
      } else {
        // Swipe vers la droite = page précédente
        handlePrev();
      }
    }

    // Reset
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Trackpad handler pour swipe horizontal avec 2 doigts
  const handleWheel = (e: React.WheelEvent) => {
    // Détecter uniquement les swipes horizontaux (deltaX)
    // Ignorer les scrolls verticaux (deltaY)
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();

      // Throttle pour éviter les changements trop rapides (800ms entre chaque changement)
      const now = Date.now();
      if (now - lastWheelTime.current < 800) {
        return;
      }

      const swipeThreshold = 10; // Sensibilité du swipe

      if (e.deltaX > swipeThreshold) {
        // Swipe vers la gauche (2 doigts vers la gauche) = page suivante
        lastWheelTime.current = now;
        handleNext();
      } else if (e.deltaX < -swipeThreshold) {
        // Swipe vers la droite (2 doigts vers la droite) = page précédente
        lastWheelTime.current = now;
        handlePrev();
      }
    }
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
      <DialogContent
        className="sm:max-w-md select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 animate-scale-in">
              <Icon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-xl">{step.title}</DialogTitle>
          <DialogDescription className="text-base pt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 py-4">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? "bg-primary w-6"
                  : index < currentStep
                    ? "bg-primary/50"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row gap-2 items-center w-full">
          {/* Zone gauche */}
          <div className="flex-1 flex justify-start">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrev} size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour
              </Button>
            )}
          </div>

          {/* Zone centre */}
          <div className="flex-1 flex justify-center">
            {!isLastStep && (
              <Button
                variant="outline"
                onClick={handleSkip}
                size="sm"
                className="min-w-[80px]"
              >
                Passer
              </Button>
            )}
          </div>

          {/* Zone droite */}
          <div className="flex-1 flex justify-end">
            <Button
              onClick={handleNext}
              className="bg-gradient-primary hover:opacity-90 min-w-[100px] sm:min-w-[120px] border border-primary/30"
              size="sm"
            >
              {isLastStep ? (
                <>
                  C'est parti !
                  <Rocket className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
