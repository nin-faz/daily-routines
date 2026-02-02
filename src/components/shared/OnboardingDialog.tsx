import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, FolderKanban, Bell, ChevronRight, ChevronLeft, Rocket } from "lucide-react";

const ONBOARDING_KEY = "onboarding_completed";

const steps = [
  {
    icon: Sparkles,
    title: "Bienvenue sur Mes Routines ! 🎉",
    description: "Votre compagnon quotidien pour développer de bonnes habitudes et gérer vos projets efficacement.",
  },
  {
    icon: Calendar,
    title: "Créez vos routines",
    description: "Ajoutez des routines pour le matin, l'après-midi ou le soir. Définissez des minuteurs et des rappels pour rester sur la bonne voie.",
  },
  {
    icon: FolderKanban,
    title: "Gérez vos projets",
    description: "Organisez vos tâches avec un tableau Kanban intuitif. Suivez l'avancement de vos projets facilement.",
  },
  {
    icon: Bell,
    title: "Restez notifié",
    description: "Activez les notifications pour ne jamais manquer une routine. L'app fonctionne même hors-ligne !",
  },
  {
    icon: Rocket,
    title: "Prêt à commencer ?",
    description: "Créez votre première routine en cliquant sur le bouton + en bas de l'écran. Bonne productivité !",
  },
];

const OnboardingDialog = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

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

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
      <DialogContent className="sm:max-w-md">
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

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <div>
            {currentStep > 0 && (
              <Button variant="ghost" onClick={handlePrev} size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {!isLastStep && (
              <Button variant="ghost" onClick={handleSkip} size="sm">
                Passer
              </Button>
            )}
            <Button onClick={handleNext} className="bg-gradient-primary hover:opacity-90">
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
