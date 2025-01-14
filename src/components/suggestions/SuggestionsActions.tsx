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
        className="group rounded-full backdrop-blur-lg bg-gradient-to-r from-purple-500/80 via-blue-500/80 to-purple-500/80 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_32px_rgba(31,34,245,0.12)] text-white/90 hover:text-white hover:bg-white/20 transition-all duration-300 min-h-[3rem] sm:min-h-[2.75rem] touch-manipulation text-base sm:text-sm"
        aria-label="Generate more gift suggestions"
      >
        <Sparkles className="w-5 h-5 sm:w-4 sm:h-4 mr-2 animate-pulse group-hover:animate-none" aria-hidden="true" />
        Generate More Ideas
      </Button>
      <Button
        onClick={onStartOver}
        variant="outline"
        className="rounded-full backdrop-blur-lg border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_32px_rgba(31,34,245,0.12)] hover:bg-white/20 transition-all duration-300 min-h-[3rem] sm:min-h-[2.75rem] touch-manipulation text-base sm:text-sm"
        aria-label="Start a new gift search"
      >
        <RotateCcw className="w-5 h-5 sm:w-4 sm:h-4 mr-2" aria-hidden="true" />
        Start Over
      </Button>
    </div>
  );
};