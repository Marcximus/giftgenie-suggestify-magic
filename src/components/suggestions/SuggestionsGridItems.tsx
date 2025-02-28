
import { SuggestionLoadingSkeletons } from './SuggestionLoadingSkeletons';
import { SuggestionItem } from './SuggestionItem';
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

  // If we're loading and have no visible suggestions yet, show the loading skeletons
  if (isLoading && visibleSuggestions.length === 0) {
    return (
      <>
        <SuggestionLoadingSkeletons count={8} />
        {/* Adding the loading indicator as a separate div outside the grid */}
        <div className="col-span-full w-full mt-8">
          <LoadingProgressIndicator processedCount={0} total={8} />
        </div>
      </>
    );
  }

  // Render a mix of loaded suggestions and skeletons during partial loading
  const displaySuggestions = [...visibleSuggestions];
  const skeletonsNeeded = isLoading ? Math.max(0, 8 - displaySuggestions.length) : 0;

  return (
    <>
      {/* Display loaded suggestions */}
      {displaySuggestions.map((suggestion, index) => {
        // Only pass string descriptions, not undefined or objects
        const customDescription = suggestion.title && typeof customDescriptions[suggestion.title] === 'string' 
          ? customDescriptions[suggestion.title] 
          : undefined;
        
        return (
          <SuggestionItem
            key={`item-${index}-${suggestion.amazon_asin || suggestion.title}`}
            suggestion={suggestion}
            index={index}
            customDescription={customDescription}
            onMoreLikeThis={onMoreLikeThis}
          />
        );
      })}

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
      
      {/* Always show progress indicator during loading */}
      {isLoading && (
        <div className="col-span-full w-full mt-6 mb-4">
          <LoadingProgressIndicator 
            processedCount={processedCount} 
            total={8} 
          />
        </div>
      )}
    </>
  );
};
