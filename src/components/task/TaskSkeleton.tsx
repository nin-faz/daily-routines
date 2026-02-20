import { Skeleton } from "@/components/ui/skeleton";

export const TaskCardSkeleton = () => {
  return (
    <div className="p-4 rounded-lg border border-border animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-8" />
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
};

export const TaskListSkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  );
};

export default TaskListSkeleton;
