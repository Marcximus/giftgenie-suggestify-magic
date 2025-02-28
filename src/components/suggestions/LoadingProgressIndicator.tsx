
import { Spinner } from "@/components/ui/spinner";

interface LoadingProgressIndicatorProps {
  processedCount: number;
  total: number;
}

export const LoadingProgressIndicator = ({ 
  processedCount, 
  total 
}: LoadingProgressIndicatorProps) => {
  const progressPercentage = Math.min(Math.round((processedCount / total) * 100), 100);
  
  return (
    <div className="col-span-full text-center py-4 flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        <Spinner variant="infinite" className="text-primary w-5 h-5" />
        <span className="text-sm font-medium text-muted-foreground">
          Loading {processedCount} of {total} suggestions...
        </span>
      </div>
      <div className="w-full max-w-xs bg-gray-200 rounded-full h-1.5 mt-1">
        <div 
          className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};
