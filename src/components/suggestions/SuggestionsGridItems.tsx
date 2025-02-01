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
  const abortController = useRef<AbortController | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!Array.isArray(suggestions)) {
      console.error('Invalid suggestions array:', suggestions);
      return;
    }

    console.log('Processing suggestions:', suggestions);

    if (suggestions.length === 0) {
      setCustomDescriptions({});
      onAllSuggestionsProcessed(false);
      return;
    }

    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    let completedCount = 0;

    const processSuggestions = async () => {
      for (const suggestion of suggestions) {
        if (abortController.current?.signal.aborted) {
          break;
        }

        try {
          // Generate custom description
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

          completedCount++;
          if (completedCount === suggestions.length) {
            onAllSuggestionsProcessed(true);
          }

        } catch (error) {
          console.error('Error processing suggestion:', error);
          completedCount++;
        }
      }
    };

    processSuggestions();

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      onAllSuggestionsProcessed(false);
    };
  }, [suggestions, onAllSuggestionsProcessed]);

  if (isLoading) {
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

  return (
    <>
      {suggestions.map((suggestion, index) => {
        const customDescription = suggestion.title ? customDescriptions[suggestion.title] : suggestion.description;

        return (
          <div 
            key={`suggestion-${index}`}
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
    </>
  );
};