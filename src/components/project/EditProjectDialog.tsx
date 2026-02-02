import { useState } from "react";
import { Project } from "@/types/project";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EditProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<Project>) => void;
}

const EditProjectDialog = ({
  project,
  open,
  onOpenChange,
  onSave,
}: EditProjectDialogProps) => {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(project.id, {
      title: title.trim(),
      description: description.trim() || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Modifier le projet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Titre</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mon projet"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (optionnelle)</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du projet..."
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full">
            Enregistrer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog;
