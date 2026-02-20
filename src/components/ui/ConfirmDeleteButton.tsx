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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ConfirmDeleteButtonProps {
  onConfirm: () => void;
  label?: string;
  description?: string;
  iconSize?: number;
  buttonClassName?: string;
  actionLabel?: string;
}

const ConfirmDeleteButton = ({
  onConfirm,
  label = "Supprimer ?",
  description = "Cette action est irréversible.",
  iconSize = 16,
  buttonClassName = "h-8 w-8 shrink-0 text-destructive",
  actionLabel = "Supprimer",
}: ConfirmDeleteButtonProps) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className={
          buttonClassName +
          " hover:text-destructive hover:bg-destructive/10 p-0"
        }
        title={label}
        onClick={(e) => e.stopPropagation()}
      >
        <Trash2 className={`h-${iconSize} w-${iconSize}`} />
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{label}</AlertDialogTitle>
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
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {actionLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ConfirmDeleteButton;
