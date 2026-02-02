import { cn } from "@/lib/utils";

const Loader = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn("min-h-screen flex items-center justify-center", className)}
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary"
        aria-label="Chargement"
      />
    </div>
  );
};

export default Loader;
