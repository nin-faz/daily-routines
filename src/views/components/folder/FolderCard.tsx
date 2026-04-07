import { Folder } from "@/shared/types/folder";
import { Button } from "@/shared/components/ui/button";
import { Pencil } from "lucide-react";
import ConfirmDeleteButton from "@/shared/components/ui/ConfirmDeleteButton";
import { FOLDER_ICONS, FOLDER_COLORS } from "@/shared/config/folderOptions";
import { cn } from "@/shared/lib/utils";

interface FolderCardProps {
  folder: Folder;
  taskCount: number;
  completedCount: number;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const FolderCard = ({
  folder,
  taskCount,
  completedCount,
  isSelected,
  onClick,
  onEdit,
  onDelete,
}: FolderCardProps) => {
  const iconObj = FOLDER_ICONS.find((i) => i.name === folder.icon);
  const Icon = iconObj ? iconObj.icon : FOLDER_ICONS[0].icon;

  const colorObj = FOLDER_COLORS.find((c) => c.name === folder.color);
  const colorClass = colorObj ? colorObj.class : FOLDER_COLORS[0].class;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
      )}
    >
      <div className={cn("p-2 rounded-lg", colorClass)}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{folder.name}</p>
        <p className="text-xs text-muted-foreground">
          {completedCount}/{taskCount} complétées
        </p>
      </div>

      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Modifier"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <ConfirmDeleteButton
          onConfirm={onDelete}
          label="Supprimer le dossier ?"
          description={`Cette action supprimera définitivement "${folder.name}" et toutes ses tâches.`}
          iconSize={3.5}
          buttonClassName="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive"
          actionLabel="Supprimer"
        />
      </div>
    </div>
  );
};

export default FolderCard;
