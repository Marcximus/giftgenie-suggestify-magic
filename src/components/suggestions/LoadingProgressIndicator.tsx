
import { TextShimmer } from "@/components/ui/text-shimmer";

interface LoadingProgressIndicatorProps {
  processedCount: number;
  total: number;
}

export const LoadingProgressIndicator = ({ 
  processedCount, 
  total 
}: LoadingProgressIndicatorProps) => {
  return (
    <div className="col-span-full text-center py-4 text-sm">
      <TextShimmer
        duration={1.8}
        className="font-medium [--base-color:theme(colors.muted.foreground)] [--base-gradient-color:theme(colors.primary.DEFAULT)]"
      >
        Loaded {processedCount} of {total} suggestions...
      </TextShimmer>
    </div>
  );
};
