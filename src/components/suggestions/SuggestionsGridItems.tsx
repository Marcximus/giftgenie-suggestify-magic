import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductCard } from '../ProductCard';
import { SuggestionSkeleton } from '../SuggestionSkeleton';
import { GiftSuggestion } from '@/types/suggestions';
import { supabase } from "@/integrations/supabase/client";

interface SuggestionsGridItemsProps {
  suggestions: GiftSuggestion[];
  onMoreLikeThis: (title: string) => void;
  isLoading: boolean;
  onAllProcessed: (processed: boolean) => void;
}

export const SuggestionsGridItems = ({
  suggestions,
  onMoreLikeThis,
  isLoading,
  onAllProcessed
}: SuggestionsGridItemsProps) => {
  const [processedSuggestions, setProcessedSuggestions] = useState<(GiftSuggestion & { optimizedTitle: string })[]>([]);
  const [processingIndexes, setProcessingIndexes] = useState<Set<number>>(new Set());
  const abortController = useRef<AbortController | null>(null);
  const [allItemsProcessed, setAllItemsProcessed] = useState(false);

  const generateTitle = useCallback(async (originalTitle: string, description: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-title', {
        body: { title: originalTitle, description }
      });

      if (error) throw error;
      return data?.title || originalTitle;
    } catch (error) {
      console.error('Error generating title:', error);
      return originalTitle;
    }
  }, []);

  useEffect(() => {
    if (suggestions.length === 0) {
      setProcessedSuggestions([]);
      setProcessingIndexes(new Set());
      setAllItemsProcessed(false);
      onAllProcessed(false);
      return;
    }

    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    const processSuggestions = async () => {
      setAllItemsProcessed(false);
      onAllProcessed(false);
      
      // Reset processed suggestions but keep existing ones
      setProcessedSuggestions(prev => prev.filter(p => 
        suggestions.some(s => s.title === p.title)
      ));

      for (let index = 0; index < suggestions.length; index++) {
        try {
          // Skip if already processed
          if (processedSuggestions.some(p => p.title === suggestions[index].title)) {
            continue;
          }

          setProcessingIndexes(prev => new Set([...prev, index]));
          
          const suggestion = suggestions[index];
          const optimizedTitle = await generateTitle(suggestion.title, suggestion.description);
          
          // Add small delay to prevent overwhelming the UI
          await new Promise(resolve => setTimeout(resolve, 100));
          
          setProcessedSuggestions(prev => {
            // Avoid duplicates
            if (prev.some(p => p.title === suggestion.title)) {
              return prev;
            }
            return [
              ...prev,
              {
                ...suggestion,
                optimizedTitle
              }
            ];
          });

          setProcessingIndexes(prev => {
            const newIndexes = new Set(prev);
            newIndexes.delete(index);
            return newIndexes;
          });
        } catch (error) {
          if (error.message !== 'Processing aborted') {
            console.error(`Error processing suggestion ${index}:`, error);
          }
        }
      }

      // Set all items as processed only when everything is done
      setAllItemsProcessed(true);
      onAllProcessed(true);
    };

    processSuggestions();

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [suggestions, generateTitle, onAllProcessed]);

  if (isLoading && suggestions.length === 0) {
    return (
      <>
        {Array.from({ length: 4 }).map((_, index) => (
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
        const processed = processedSuggestions.find(p => p.title === suggestion.title);
        const isProcessing = processingIndexes.has(index);

        return (
          <div 
            key={`suggestion-${index}`}
            className={`
              animate-in fade-in slide-in-from-bottom duration-500
              ${processed ? '' : 'opacity-0'}
            `}
            style={{ 
              animationDelay: `${index * 200}ms`
            }}
          >
            {isProcessing ? (
              <SuggestionSkeleton />
            ) : processed && (
              <ProductCard
                title={processed.optimizedTitle}
                description={processed.description}
                price={processed.amazon_price 
                  ? processed.amazon_price.toString()
                  : processed.priceRange?.replace('USD ', '') || 'Check price on Amazon'}
                amazonUrl={processed.amazon_url || "#"}
                imageUrl={processed.amazon_image_url}
                rating={processed.amazon_rating}
                totalRatings={processed.amazon_total_ratings}
                asin={processed.amazon_asin}
                onMoreLikeThis={onMoreLikeThis}
              />
            )}
          </div>
        );
      })}
    </>
  );
};
