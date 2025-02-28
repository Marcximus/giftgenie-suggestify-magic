
import { Progress } from "@/components/ui/progress";

interface LoadingProgressIndicatorProps {
  processedCount: number;
  total: number;
}

export const LoadingProgressIndicator = ({ 
  processedCount, 
  total 
}: LoadingProgressIndicatorProps) => {
  const percentComplete = Math.min(Math.round((processedCount / total) * 100), 100);
  
  return (
    <div className="w-full space-y-2 px-4 py-6 bg-background/80 rounded-lg shadow-sm">
      <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
        <span className="font-medium">Loading suggestions...</span>
        <span>{processedCount} of {total}</span>
      </div>
      
      <Progress 
        value={percentComplete} 
        className="h-2 w-full bg-gray-100" 
        indicatorClassName="bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 animate-gradient" 
      />
      
      <p className="text-xs text-center text-muted-foreground mt-2">
        Finding the perfect gift ideas for you
      </p>
    </div>
  );
};
