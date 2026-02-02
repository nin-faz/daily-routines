import { useState } from "react";
import { Project } from "@/types/project";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface CreateProjectDialogProps {
  onCreateProject: (project: Project) => void;
}

const CreateProjectDialog = ({ onCreateProject }: CreateProjectDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const project: Project = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onCreateProject(project);
    setTitle("");
    setDescription("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="fixed bottom-20 right-4 z-50 group">
          <Button
            size="lg"
            className="rounded-full h-12 w-12 shadow-xl bg-gradient-primary hover:opacity-90 transition-all hover:scale-105 relative"
          >
            <Plus className="h-5 w-5" />
          </Button>
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-ping" />
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full" />
          <span className="absolute -top-10 right-0 bg-popover text-popover-foreground px-3 py-1.5 rounded-lg text-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Nouveau projet
          </span>
        </div>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Créer un projet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mon projet"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnelle)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du projet..."
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full">
            Créer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
