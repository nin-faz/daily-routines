import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const RoutineSkeleton = () => {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-6 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardContent>
    </Card>
  );
};

export const RoutineListSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="space-y-3">
          <RoutineSkeleton />
          <RoutineSkeleton />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-3">
          <RoutineSkeleton />
        </div>
      </div>
    </div>
  );
};

export default RoutineSkeleton;
