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

const titleCache = new Map<string, string>();

export const SuggestionsGridItems = ({
  suggestions,
  onMoreLikeThis,
  isLoading
}: SuggestionsGridItemsProps) => {
  const [processedSuggestions, setProcessedSuggestions] = useState<(GiftSuggestion & { optimizedTitle: string })[]>([]);
  const [processingIndexes, setProcessingIndexes] = useState<Set<number>>(new Set());
  const abortController = useRef<AbortController | null>(null);

  const generateTitle = useCallback(async (originalTitle: string) => {
    const cacheKey = originalTitle;
    if (titleCache.has(cacheKey)) {
      console.log('Cache hit for title:', originalTitle);
      return titleCache.get(cacheKey)!;
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-product-title', {
        body: { title: originalTitle }
      });

      if (error) throw error;
      const optimizedTitle = data?.title || originalTitle;
      titleCache.set(cacheKey, optimizedTitle);
      return optimizedTitle;
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

      // Process all suggestions in parallel with Promise.all
      const batchSize = 4; // Process in smaller batches for better UX
      const batches = Math.ceil(suggestions.length / batchSize);

      for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
        const batchStart = batchIndex * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, suggestions.length);
        const batchItems = suggestions.slice(batchStart, batchEnd);

        // Mark batch items as processing
        setProcessingIndexes(prev => {
          const newIndexes = new Set(prev);
          batchItems.forEach((_, index) => newIndexes.add(batchStart + index));
          return newIndexes;
        });

        try {
          // Process batch items in parallel
          const batchPromises = batchItems.map(async (suggestion) => {
            const optimizedTitle = await generateTitle(suggestion.title);
            return {
              ...suggestion,
              optimizedTitle
            };
          });

          // Wait for all items in the batch to complete
          const batchResults = await Promise.all(batchPromises);

          // Update state while preserving order
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

        // Add a small delay between batches to prevent rate limiting
        if (batchIndex < batches - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
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