import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductCard } from '../ProductCard';
import { SuggestionSkeleton } from '../SuggestionSkeleton';
import { GiftSuggestion } from '@/types/suggestions';
import { supabase } from "@/integrations/supabase/client";

interface SuggestionsGridItemsProps {
  suggestions: GiftSuggestion[];
  onMoreLikeThis: (title: string) => void;
  isLoading: boolean;
}

export const SuggestionsGridItems = ({
  suggestions,
  onMoreLikeThis,
  isLoading
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
      return;
    }

    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    const processSuggestions = async () => {
      const startTime = performance.now();
      console.log('Starting parallel processing of suggestions');

      // Process suggestions in parallel batches of 4
      const batchSize = 4;
      const batches = Math.ceil(suggestions.length / batchSize);

      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const batchStart = batchIndex * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, suggestions.length);
        const batchItems = suggestions.slice(batchStart, batchEnd);

        try {
          // Process batch in parallel
          const batchResults = await Promise.all(
            batchItems.map(async (suggestion, index) => {
              const globalIndex = batchStart + index;
              setProcessingIndexes(prev => new Set([...prev, globalIndex]));

              const optimizedTitle = await generateTitle(suggestion.title, suggestion.description);
              
              return {
                ...suggestion,
                optimizedTitle
              };
            })
          );

          // Update state with batch results while preserving order
          setProcessedSuggestions(prev => {
            const newSuggestions = [...prev];
            batchResults.forEach((result, index) => {
              newSuggestions[batchStart + index] = result;
            });
            return newSuggestions;
          });

          // Update processing indexes
          setProcessingIndexes(prev => {
            const newIndexes = new Set(prev);
            batchItems.forEach((_, index) => {
              newIndexes.delete(batchStart + index);
            });
            return newIndexes;
          });

        } catch (error) {
          if (error.message !== 'Processing aborted') {
            console.error('Error processing batch:', error);
          }
        }
      }

      const duration = performance.now() - startTime;
      console.log(`All suggestions processed in ${duration.toFixed(2)}ms`);
    };

    processSuggestions();

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [suggestions, generateTitle]);

  if (isLoading) {
    return (
      <>
        {Array.from({ length: 8 }).map((_, index) => (
          <div 
            key={`skeleton-${index}`} 
            className="animate-in fade-in slide-in-from-bottom-4" 
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

        if (!processed && isProcessing) {
          return (
            <div 
              key={`processing-${index}`}
              className="animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <SuggestionSkeleton />
            </div>
          );
        }

        if (!processed) {
          return null;
        }

        const price = processed.amazon_price 
          ? processed.amazon_price.toString()
          : processed.priceRange?.replace('USD ', '') || 'Check price on Amazon';

        return (
          <div 
            key={`suggestion-${index}`}
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{ 
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'forwards' 
            }}
          >
            <ProductCard
              title={processed.optimizedTitle}
              description={processed.description}
              price={price}
              amazonUrl={processed.amazon_url || "#"}
              imageUrl={processed.amazon_image_url}
              rating={processed.amazon_rating}
              totalRatings={processed.amazon_total_ratings}
              asin={processed.amazon_asin}
              onMoreLikeThis={onMoreLikeThis}
            />
          </div>
        );
      })}
    </>
  );
};