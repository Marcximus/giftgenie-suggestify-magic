import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductCard } from '../ProductCard';
import { SuggestionSkeleton } from '../SuggestionSkeleton';
import { GiftSuggestion } from '@/types/suggestions';
import { supabase } from "@/integrations/supabase/client";
import { processBatch } from '@/utils/amazon/batchProcessor';

interface SuggestionsGridItemsProps {
  suggestions: GiftSuggestion[];
  onMoreLikeThis: (title: string) => void;
  isLoading: boolean;
}

// Cache for generated titles to prevent redundant API calls
const titleCache = new Map<string, string>();

export const SuggestionsGridItems = ({
  suggestions,
  onMoreLikeThis,
  isLoading
}: SuggestionsGridItemsProps) => {
  const [processedSuggestions, setProcessedSuggestions] = useState<Map<number, GiftSuggestion & { optimizedTitle: string }>>(new Map());
  const abortController = useRef<AbortController | null>(null);

  const generateTitle = useCallback(async (suggestion: GiftSuggestion, index: number) => {
    const cacheKey = `${suggestion.title}-${suggestion.description}`;
    if (titleCache.has(cacheKey)) {
      setProcessedSuggestions(prev => new Map(prev).set(index, {
        ...suggestion,
        optimizedTitle: titleCache.get(cacheKey)!
      }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-product-title', {
        body: {
          title: suggestion.title,
          description: suggestion.description
        }
      });

      if (error) throw error;

      const optimizedTitle = data.title || suggestion.title;
      titleCache.set(cacheKey, optimizedTitle);

      setProcessedSuggestions(prev => new Map(prev).set(index, {
        ...suggestion,
        optimizedTitle
      }));
    } catch (error) {
      console.error('Error generating title:', error);
      // On error, use the original title
      setProcessedSuggestions(prev => new Map(prev).set(index, {
        ...suggestion,
        optimizedTitle: suggestion.title
      }));
    }
  }, []);

  useEffect(() => {
    if (suggestions.length === 0) return;
    
    setProcessedSuggestions(new Map());
    
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    const processSuggestions = async () => {
      try {
        console.log('Processing suggestions in batches');
        const startTime = performance.now();

        // Process suggestions in parallel with a maximum of 4 concurrent requests
        const batchSize = 4;
        for (let i = 0; i < suggestions.length; i += batchSize) {
          const batch = suggestions.slice(i, i + batchSize);
          await Promise.all(
            batch.map((suggestion, batchIndex) => 
              generateTitle(suggestion, i + batchIndex)
            )
          );
          // Add a small delay between batches
          if (i + batchSize < suggestions.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        const duration = performance.now() - startTime;
        console.log(`All suggestions processed in ${duration}ms`);
      } catch (error) {
        if (error.message !== 'Processing aborted') {
          console.error('Error processing suggestions:', error);
        }
      }
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
        const processed = processedSuggestions.get(index);

        if (!processed) {
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