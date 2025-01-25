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

// Cache for generated titles to prevent redundant API calls
const titleCache = new Map<string, string>();

export const SuggestionsGridItems = ({
  suggestions,
  onMoreLikeThis,
  isLoading
}: SuggestionsGridItemsProps) => {
  const [processedSuggestions, setProcessedSuggestions] = useState<(GiftSuggestion & { optimizedTitle: string })[]>([]);
  const abortController = useRef<AbortController | null>(null);

  const generateTitle = useCallback(async (originalTitle: string, description: string) => {
    const cacheKey = `${originalTitle}-${description}`;
    if (titleCache.has(cacheKey)) {
      console.log('Cache hit for title:', originalTitle);
      return titleCache.get(cacheKey)!;
    }

    const startTime = performance.now();
    console.log('Generating title for:', originalTitle);

    try {
      const { data, error } = await supabase.functions.invoke('generate-product-title', {
        body: { title: originalTitle, description }
      });

      if (error) throw error;

      const optimizedTitle = data?.title || originalTitle;
      titleCache.set(cacheKey, optimizedTitle);

      const duration = performance.now() - startTime;
      console.log(`Title generation took ${duration}ms`);

      return optimizedTitle;
    } catch (error) {
      console.error('Error generating title:', error);
      return originalTitle;
    }
  }, []);

  useEffect(() => {
    if (suggestions.length === 0) return;
    
    // Reset state when suggestions change
    setProcessedSuggestions([]);
    
    // Cleanup previous processing
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    // Process all suggestions in parallel
    const processSuggestions = async () => {
      try {
        console.log('Processing all suggestions in parallel');
        const startTime = performance.now();

        const results = await Promise.all(
          suggestions.map(async (suggestion, index) => {
            if (abortController.current?.signal.aborted) {
              throw new Error('Processing aborted');
            }

            const optimizedTitle = await generateTitle(suggestion.title, suggestion.description);
            console.log(`Processed suggestion ${index + 1}/${suggestions.length}`);
            
            return {
              ...suggestion,
              optimizedTitle
            };
          })
        );

        if (!abortController.current?.signal.aborted) {
          setProcessedSuggestions(results);
          const duration = performance.now() - startTime;
          console.log(`All suggestions processed in ${duration}ms`);
        }
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
        const processed = processedSuggestions[index];

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