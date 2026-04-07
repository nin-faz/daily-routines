import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { FolderPlus } from "lucide-react";
import { FOLDER_ICONS, FOLDER_COLORS } from "@/shared/config/folderOptions";
import { Folder } from "@/shared/types/folder";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import { folderSchema } from "@/shared/lib/validationSchemas";

interface CreateFolderDialogProps {
  folder?: Folder;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreateFolder?: (
    folder: Omit<Folder, "id" | "createdAt" | "userId" | "updatedAt">,
  ) => void;
  onUpdateFolder?: (id: string, updates: Partial<Folder>) => void;
  trigger?: React.ReactNode;
}

const CreateFolderDialog = ({
  folder,
  open: controlledOpen,
  onOpenChange,
  onCreateFolder,
  onUpdateFolder,
  trigger,
}: CreateFolderDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("folder");
  const [selectedColor, setSelectedColor] = useState("default");

  const isEditMode = !!folder;
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    if (folder && open) {
      setName(folder.name);
      setSelectedIcon(folder.icon);
      setSelectedColor(folder.color);
    } else if (!open) {
      setName("");
      setSelectedIcon("folder");
      setSelectedColor("default");
    }
  }, [folder, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 🔒 SÉCURITÉ : Validation stricte des données
    const validationResult = folderSchema.safeParse({ name: name });

    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    const safeData = validationResult.data;

    if (isEditMode && onUpdateFolder && folder) {
      onUpdateFolder(folder.id, {
        ...folder,
        name: safeData.name,
        icon: selectedIcon,
        color: selectedColor,
      });
      toast.success("Dossier modifié avec succès");
    } else if (onCreateFolder) {
      onCreateFolder({
        name: safeData.name,
        icon: selectedIcon,
        color: selectedColor,
      });
      toast.success("Dossier créé avec succès");
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEditMode && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="gap-2">
              <FolderPlus className="h-4 w-4" />
              Nouveau dossier
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Modifier le dossier" : "Créer un dossier"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Modifiez le nom, l'icône ou la couleur du dossier."
              : "Donnez un nom, choisissez une icône et une couleur pour votre dossier."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Achats, Travail..."
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Icône</Label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_ICONS.map(({ name: iconName, icon: Icon }) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setSelectedIcon(iconName)}
                  className={cn(
                    "p-2 rounded-lg border transition-colors",
                    selectedIcon === iconName
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLORS.map(({ name: colorName, class: colorClass }) => (
                <button
                  key={colorName}
                  type="button"
                  onClick={() => setSelectedColor(colorName)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    colorClass,
                    selectedColor === colorName
                      ? "ring-2 ring-primary ring-offset-2"
                      : "hover:scale-110",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {isEditMode ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolderDialog;
