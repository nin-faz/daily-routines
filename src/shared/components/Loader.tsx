import { cn } from "@/shared/lib/utils";

const Loader = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn("fixed inset-0 z-50 flex items-center justify-center bg-background", className)}
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary"
        aria-label="Chargement"
        role="status"
      />
    </div>
  );
};

export default Loader;
