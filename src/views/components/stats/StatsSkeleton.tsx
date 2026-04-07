import { Skeleton } from "@/shared/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";

export const StatsCardSkeleton = () => {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4 text-center animate-pulse">
        <Skeleton className="h-5 w-5 mx-auto mb-2 rounded-full" />
        <Skeleton className="h-6 w-12 mx-auto mb-1" />
        <Skeleton className="h-3 w-16 mx-auto" />
      </CardContent>
    </Card>
  );
};

export const ChartSkeleton = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="p-4">
        <Skeleton className="h-40 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
};

export const StatsSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
};

export default StatsSkeleton;
