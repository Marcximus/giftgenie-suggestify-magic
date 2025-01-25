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

  const generateTitles = useCallback(async (suggestions: GiftSuggestion[]) => {
    const startTime = performance.now();
    console.log('Processing suggestions in batch');

    // Filter out suggestions that are already in cache
    const uncachedSuggestions = suggestions.filter(suggestion => {
      const cacheKey = `${suggestion.title}-${suggestion.description}`;
      return !titleCache.has(cacheKey);
    });

    if (uncachedSuggestions.length === 0) {
      console.log('All titles found in cache');
      return suggestions.map(suggestion => {
        const cacheKey = `${suggestion.title}-${suggestion.description}`;
        return {
          ...suggestion,
          optimizedTitle: titleCache.get(cacheKey)!
        };
      });
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-product-title', {
        body: {
          titles: uncachedSuggestions.map(s => ({
            title: s.title,
            description: s.description
          }))
        }
      });

      if (error) throw error;

      // Update cache with new titles
      uncachedSuggestions.forEach((suggestion, index) => {
        const cacheKey = `${suggestion.title}-${suggestion.description}`;
        titleCache.set(cacheKey, data.titles[index] || suggestion.title);
      });

      // Combine cached and new titles
      const processedResults = suggestions.map(suggestion => {
        const cacheKey = `${suggestion.title}-${suggestion.description}`;
        return {
          ...suggestion,
          optimizedTitle: titleCache.get(cacheKey) || suggestion.title
        };
      });

      const duration = performance.now() - startTime;
      console.log(`Batch title generation completed in ${duration}ms`);

      return processedResults;
    } catch (error) {
      console.error('Error generating titles:', error);
      return suggestions.map(suggestion => ({
        ...suggestion,
        optimizedTitle: suggestion.title
      }));
    }
  }, []);

  useEffect(() => {
    if (suggestions.length === 0) return;
    
    setProcessedSuggestions([]);
    
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    const processSuggestions = async () => {
      try {
        console.log('Processing all suggestions in batch');
        const startTime = performance.now();

        const results = await generateTitles(suggestions);

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
  }, [suggestions, generateTitles]);

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