import { Loader2 } from 'lucide-react';

interface LoadingMessageProps {
  isLoading: boolean;
}

export const LoadingMessage = ({ isLoading }: LoadingMessageProps) => {
  if (!isLoading) return null;

  return (
    <div className="flex items-center justify-center mt-2">
      <Loader2 className="h-6 w-6 animate-spin text-primary/80" />
      <span className="ml-2 text-sm text-muted-foreground animate-pulse-text">
        Searching for the perfect gifts...
      </span>
    </div>
  );
};