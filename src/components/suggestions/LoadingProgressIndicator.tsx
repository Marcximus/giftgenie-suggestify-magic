
interface LoadingProgressIndicatorProps {
  processedCount: number;
  total: number;
}

export const LoadingProgressIndicator = ({ 
  processedCount, 
  total 
}: LoadingProgressIndicatorProps) => {
  return (
    <div className="col-span-full text-center py-4 text-sm text-muted-foreground">
      Loaded {processedCount} of {total} suggestions...
    </div>
  );
};
