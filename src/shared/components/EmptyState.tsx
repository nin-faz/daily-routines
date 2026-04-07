import { LucideIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="mb-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <Icon className="h-10 w-10 text-primary/60" />
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-2 text-foreground">{title}</h2>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} className="bg-gradient-primary hover:opacity-90">
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
