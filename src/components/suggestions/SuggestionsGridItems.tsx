import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductCard } from '../ProductCard';
import { SuggestionSkeleton } from '../SuggestionSkeleton';
import { GiftSuggestion } from '@/types/suggestions';
import { supabase } from "@/integrations/supabase/client";

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
  const [processedSuggestions, setProcessedSuggestions] = useState<(GiftSuggestion & { optimizedTitle: string })[]>([]);
  const [processingIndexes, setProcessingIndexes] = useState<Set<number>>(new Set());
  const abortController = useRef<AbortController | null>(null);

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
      onAllSuggestionsProcessed(false);
      return;
    }

    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    // Initialize processed suggestions array with nulls
    setProcessedSuggestions(new Array(suggestions.length).fill(null));
    onAllSuggestionsProcessed(false);

    const processSuggestionsSequentially = async () => {
      let completedCount = 0;

      for (let index = 0; index < suggestions.length; index++) {
        if (abortController.current?.signal.aborted) {
          break;
        }

        try {
          setProcessingIndexes(prev => new Set([...prev, index]));
          
          const suggestion = suggestions[index];
          const optimizedTitle = await generateTitle(suggestion.title, suggestion.description);

          setProcessedSuggestions(prev => {
            const newSuggestions = [...prev];
            newSuggestions[index] = {
              ...suggestion,
              optimizedTitle
            };
            return newSuggestions;
          });

          setProcessingIndexes(prev => {
            const newIndexes = new Set(prev);
            newIndexes.delete(index);
            return newIndexes;
          });

          completedCount++;
          // Only set to true when all suggestions are processed
          if (completedCount === suggestions.length) {
            onAllSuggestionsProcessed(true);
          }

        } catch (error) {
          if (error.message !== 'Processing aborted') {
            console.error(`Error processing suggestion ${index}:`, error);
          }
        }
      }
    };

    processSuggestionsSequentially();

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      onAllSuggestionsProcessed(false);
    };
  }, [suggestions, generateTitle, onAllSuggestionsProcessed]);

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
        const processed = processedSuggestions[index];
        const isProcessing = processingIndexes.has(index);

        if (!processed && !isProcessing) {
          return null;
        }

        return (
          <div 
            key={`suggestion-${index}`}
            className={`
              animate-in fade-in slide-in-from-bottom duration-300
              ${processed ? '' : 'opacity-0'}
            `}
            style={{ 
              animationDelay: `${Math.min(index * 100, 500)}ms`
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