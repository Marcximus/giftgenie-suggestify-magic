
import { Progress } from "@/components/ui/progress";

interface LoadingProgressIndicatorProps {
  processedCount: number;
  total: number;
}

export const LoadingProgressIndicator = ({ 
  processedCount, 
  total 
}: LoadingProgressIndicatorProps) => {
  // Calculate percentage, but ensure it's at least 5% for visibility
  const percentage = Math.max(5, Math.round((processedCount / total) * 100));
  
  return (
    <div className="col-span-full flex flex-col items-center py-4 space-y-2">
      <Progress value={percentage} className="w-full max-w-md h-2" />
      <p className="text-sm text-muted-foreground">
        Loaded {processedCount} of {total} suggestions...
      </p>
    </div>
  );
};
