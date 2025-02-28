
import { Skeleton } from "@/components/ui/skeleton";

export const SuggestionSkeleton = () => {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>
      <Skeleton className="h-4 w-3/4 mx-auto" />
      <div className="px-4">
        <Skeleton className="h-3 w-11/12 mb-1" />
        <Skeleton className="h-3 w-10/12 mb-1" />
        <Skeleton className="h-3 w-9/12" />
      </div>
      <div className="px-4 flex justify-between items-center">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/5 rounded-md" />
      </div>
      <div className="flex justify-center mt-2">
        <Skeleton className="h-8 w-10/12 rounded-md" />
      </div>
    </div>
  );
};
