import { GiftSuggestion } from '@/types/suggestions';
import { SuggestionProcessor } from './SuggestionProcessor';
import { AnimatedSuggestionCard } from './AnimatedSuggestionCard';
import { LoadingSkeleton } from './LoadingSkeleton';
import { useVisibilityAnimation } from './hooks/useVisibilityAnimation';
import { useSuggestionProcessing } from './hooks/useSuggestionProcessing';

interface SuggestionsGridItemsProps {
  suggestions: GiftSuggestion[];
  onMoreLikeThis: (title: string) => void;
  isLoading: boolean;
  onAllSuggestionsProcessed: (allProcessed: boolean) => void;
}

export const SuggestionsGridItems = ({
  suggestions,
  onMoreLikeThis,
  isLoading,
  onAllSuggestionsProcessed
}: SuggestionsGridItemsProps) => {
  const visibleCount = useVisibilityAnimation(suggestions, onAllSuggestionsProcessed);
  const { optimizedTitles, customDescriptions, handleSuggestionProcessed } = useSuggestionProcessing();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <>
      {suggestions.map((suggestion, index) => (
        <div key={`suggestion-${index}`}>
          <SuggestionProcessor
            suggestion={suggestion}
            index={index}
            isVisible={index < visibleCount}
            onProcessed={(optimizedTitle, customDescription) => 
              handleSuggestionProcessed(suggestion.title, optimizedTitle, customDescription)
            }
          />
          <AnimatedSuggestionCard
            suggestion={suggestion}
            index={index}
            visibleCount={visibleCount}
            optimizedTitle={optimizedTitles[suggestion.title]}
            customDescription={customDescriptions[suggestion.title]}
            onMoreLikeThis={onMoreLikeThis}
          />
        </div>
      ))}
    </>
  );
};