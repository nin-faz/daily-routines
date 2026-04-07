import { Button } from "@/shared/components/ui/button";
import { Archive } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/shared/components/ui/alert-dialog";

interface ConfirmArchiveButtonProps {
  onConfirm: () => void;
  description?: string;
  iconSize?: number;
  buttonClassName?: string;
  actionLabel?: string;
}

const ConfirmArchiveButton = ({
  onConfirm,
  description,
  iconSize = 16,
  buttonClassName = "h-8 w-8 shrink-0 text-destructive",
  actionLabel = "Archiver",
}: ConfirmArchiveButtonProps) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className={
          buttonClassName + " hover:text-orange-600 hover:bg-orange-500/10 p-0"
        }
        onClick={(e) => e.stopPropagation()}
      >
        <Archive className={`h-${iconSize} w-${iconSize}`} />
        <span>{actionLabel} la routine</span>
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{actionLabel} définitivement ?</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel
          onClick={(e) => e.stopPropagation()}
          className="mt-2 sm:mt-0"
        >
          Annuler
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
          className="bg-orange-700 text-destructive-foreground hover:bg-orange-700/90"
        >
          {actionLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ConfirmArchiveButton;
