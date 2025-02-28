
import { SuggestionLoadingSkeletons } from './SuggestionLoadingSkeletons';
import { SuggestionItem } from '../SuggestionItem';
import { LoadingProgressIndicator } from './LoadingProgressIndicator';
import { useSuggestionProcessing } from './hooks/useSuggestionProcessing';
import { GiftSuggestion } from '@/types/suggestions';
import { SuggestionSkeleton } from '../SuggestionSkeleton';

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
  const {
    visibleSuggestions,
    customDescriptions,
    processedCount
  } = useSuggestionProcessing({
    suggestions,
    isLoading,
    onAllSuggestionsProcessed
  });

  // Render loading skeletons or visible suggestions
  if (isLoading && visibleSuggestions.length === 0) {
    return <SuggestionLoadingSkeletons count={8} />;
  }

  // Render a mix of loaded suggestions and skeletons during partial loading
  const displaySuggestions = [...visibleSuggestions];
  const skeletonsNeeded = isLoading ? Math.max(0, 8 - displaySuggestions.length) : 0;

  return (
    <>
      {displaySuggestions.map((suggestion, index) => (
        <SuggestionItem
          key={`item-${index}-${suggestion.amazon_asin || suggestion.title}`}
          suggestion={suggestion}
          index={index}
          customDescription={suggestion.title ? customDescriptions[suggestion.title] : undefined}
          onMoreLikeThis={onMoreLikeThis}
        />
      ))}

      {/* Show skeletons for remaining slots during loading */}
      {skeletonsNeeded > 0 && Array.from({ length: skeletonsNeeded }).map((_, index) => (
        <div 
          key={`loading-skeleton-${index}`} 
          className="animate-pulse"
          aria-hidden="true"
        >
          <SuggestionSkeleton />
        </div>
      ))}
      
      {/* Progress indicator that shows during partial loading */}
      {isLoading && visibleSuggestions.length > 0 && (
        <LoadingProgressIndicator processedCount={processedCount} total={8} />
      )}
    </>
  );
};
