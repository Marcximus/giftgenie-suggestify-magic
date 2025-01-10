import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw } from "lucide-react";

interface SuggestionsActionsProps {
  onGenerateMore: () => void;
  onStartOver: () => void;
  isLoading: boolean;
}

export const SuggestionsActions = ({
  onGenerateMore,
  onStartOver,
  isLoading
}: SuggestionsActionsProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8 sm:mt-12 px-4 sm:px-6">
      <Button
        onClick={onGenerateMore}
        disabled={isLoading}
        className="group bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-sm hover:shadow-md transition-all duration-200 min-h-[3rem] sm:min-h-[2.75rem] touch-manipulation text-base sm:text-sm"
        aria-label="Generate more gift suggestions"
      >
        <Sparkles className="w-5 h-5 sm:w-4 sm:h-4 mr-2 animate-pulse group-hover:animate-none" aria-hidden="true" />
        Generate More Ideas
      </Button>
      <Button
        onClick={onStartOver}
        variant="outline"
        className="flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-secondary/80 min-h-[3rem] sm:min-h-[2.75rem] touch-manipulation text-base sm:text-sm"
        aria-label="Start a new gift search"
      >
        <RotateCcw className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
        Start Over
      </Button>
    </div>
  );
};