
import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductCard } from '../ProductCard';
import { SuggestionSkeleton } from '../SuggestionSkeleton';
import { GiftSuggestion } from '@/types/suggestions';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { generateCustomDescription } from "@/utils/descriptionUtils";

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
  const [customDescriptions, setCustomDescriptions] = useState<Record<string, string>>({});
  const [visibleSuggestions, setVisibleSuggestions] = useState<GiftSuggestion[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const abortController = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // Reset visible suggestions when a new search begins
  useEffect(() => {
    if (isLoading) {
      setVisibleSuggestions([]);
      setProcessedCount(0);
    }
  }, [isLoading]);

  // Process suggestions progressively as they arrive
  useEffect(() => {
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      setCustomDescriptions({});
      setVisibleSuggestions([]);
      onAllSuggestionsProcessed(false);
      return;
    }

    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    let processedSuggestions = 0;
    
    // Process new suggestions that aren't already visible
    const newSuggestions = suggestions.filter(
      suggestion => !visibleSuggestions.some(
        vs => vs.title === suggestion.title && vs.amazon_asin === suggestion.amazon_asin
      )
    );

    if (newSuggestions.length === 0) {
      // If we've processed all suggestions, mark as complete
      if (visibleSuggestions.length === suggestions.length) {
        onAllSuggestionsProcessed(true);
      }
      return;
    }

    console.log(`Processing ${newSuggestions.length} new suggestions`);

    const processSuggestions = async () => {
      // Immediately show suggestions with existing data
      const readySuggestions = newSuggestions.filter(
        s => s.amazon_image_url && s.amazon_price
      );
      
      if (readySuggestions.length > 0) {
        console.log(`Adding ${readySuggestions.length} ready suggestions immediately`);
        setVisibleSuggestions(prev => [...prev, ...readySuggestions]);
        processedSuggestions += readySuggestions.length;
        setProcessedCount(prev => prev + readySuggestions.length);
      }

      // Process the remaining suggestions with missing data
      const pendingSuggestions = newSuggestions.filter(
        s => !s.amazon_image_url || !s.amazon_price
      );

      for (const suggestion of pendingSuggestions) {
        if (abortController.current?.signal.aborted) break;

        try {
          // Generate custom description if needed
          if (!customDescriptions[suggestion.title]) {
            const customDescription = await generateCustomDescription(
              suggestion.title,
              suggestion.description
            );

            if (customDescription) {
              setCustomDescriptions(prev => ({
                ...prev,
                [suggestion.title]: customDescription
              }));
            }
          }

          // Add to visible suggestions as soon as processed
          setVisibleSuggestions(prev => [...prev, suggestion]);
          processedSuggestions++;
          setProcessedCount(prev => prev + 1);

          // Short delay between processing items to allow UI to update
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error('Error processing suggestion:', error);
        }
      }

      // Check if all suggestions are now processed
      if (processedSuggestions === newSuggestions.length) {
        // If all suggestions are visible, mark as complete
        if (visibleSuggestions.length + processedSuggestions >= suggestions.length) {
          onAllSuggestionsProcessed(true);
        }
      }
    };

    processSuggestions();

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [suggestions, visibleSuggestions, onAllSuggestionsProcessed]);

  // Render loading skeletons or visible suggestions
  if (isLoading && visibleSuggestions.length === 0) {
    return (
      <>
        {Array.from({ length: 8 }).map((_, index) => (
          <div 
            key={`skeleton-${index}`} 
            className="animate-in fade-in duration-300 ease-out"
            style={{ animationDelay: `${index * 100}ms` }}
            aria-hidden="true"
          >
            <SuggestionSkeleton />
          </div>
        ))}
      </>
    );
  }

  // Render a mix of loaded suggestions and skeletons during partial loading
  const displaySuggestions = [...visibleSuggestions];
  const skeletonsNeeded = isLoading ? Math.max(0, 8 - displaySuggestions.length) : 0;

  return (
    <>
      {displaySuggestions.map((suggestion, index) => {
        const customDescription = suggestion.title ? customDescriptions[suggestion.title] : suggestion.description;

        return (
          <div 
            key={`suggestion-${index}-${suggestion.amazon_asin || suggestion.title}`}
            className={`
              animate-in fade-in slide-in-from-bottom duration-300
            `}
            style={{ 
              animationDelay: `${Math.min(index * 100, 500)}ms`
            }}
          >
            <ProductCard
              title={suggestion.title}
              description={customDescription || suggestion.description}
              price={suggestion.amazon_price 
                ? suggestion.amazon_price.toString()
                : suggestion.priceRange?.replace('USD ', '') || 'Check price on Amazon'}
              amazonUrl={suggestion.amazon_url || "#"}
              imageUrl={suggestion.amazon_image_url}
              rating={suggestion.amazon_rating}
              totalRatings={suggestion.amazon_total_ratings}
              asin={suggestion.amazon_asin}
              onMoreLikeThis={onMoreLikeThis}
            />
          </div>
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
      
      {/* Progress indicator that shows during partial loading */}
      {isLoading && visibleSuggestions.length > 0 && (
        <div className="col-span-full text-center py-4 text-sm text-muted-foreground">
          Loaded {processedCount} of 8 suggestions...
        </div>
      )}
    </>
  );
};
