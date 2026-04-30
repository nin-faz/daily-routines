import Lottie from "lottie-react";
import { useMemo } from "react";
import welcomeBackAnimation from "@/assets/animations/welcome-back.json";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";

const MESSAGES = [
  "Tu es là. L'app avait commencé à s'inquiéter. 😄 C'est reparti !",
  "Le champion est de retour. Les habitudes, elles, n'ont pas bougé.",
  "Pause terminée. Le meilleur moment pour recommencer, c'est maintenant.",
  "On ne compte pas les jours passés — on construit les jours qui viennent.",
  "Absent mais pas oublié. Tes routines sont prêtes, toi aussi.",
];

interface WelcomeBackModalProps {
  open: boolean;
  onDismiss: () => void;
}

const WelcomeBackModal = ({ open, onDismiss }: WelcomeBackModalProps) => {
  const message = useMemo(
    () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
    [],
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent className="max-w-sm text-center flex flex-col items-center gap-4 p-6">
        <DialogTitle className="sr-only">Bon retour !</DialogTitle>
        <div className="w-40 h-40">
          <Lottie animationData={welcomeBackAnimation} loop={true} />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Bon retour !</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>
        <Button onClick={onDismiss} className="w-full">
          C'est reparti →
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeBackModal;
