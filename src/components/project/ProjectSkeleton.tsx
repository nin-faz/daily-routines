import { Skeleton } from "@/components/ui/skeleton";

export const ProjectCardSkeleton = () => {
  return (
    <div className="p-4 rounded-lg border border-border animate-pulse">
      <div className="flex items-start justify-between mb-2">
        <Skeleton className="h-5 w-3/4" />
      </div>
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3 mb-3" />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
};

export const KanbanSkeleton = () => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((col) => (
        <div key={col} className="space-y-3">
          <Skeleton className="h-6 w-20" />
          <div className="space-y-2">
            {[1, 2].map((card) => (
              <div key={card} className="p-3 rounded-lg border border-border animate-pulse">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const ProjectListSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
        <ProjectCardSkeleton />
      </div>
      <div className="pt-4 border-t border-border">
        <Skeleton className="h-6 w-32 mb-4" />
        <KanbanSkeleton />
      </div>
    </div>
  );
};

export default ProjectCardSkeleton;
