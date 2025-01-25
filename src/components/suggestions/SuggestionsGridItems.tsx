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
  const [processedSuggestions, setProcessedSuggestions] = useState<(GiftSuggestion & { optimizedTitle: string | null })[]>([]);
  const abortController = useRef<AbortController | null>(null);

  const generateTitle = useCallback(async (suggestion: GiftSuggestion, index: number) => {
    const cacheKey = `${suggestion.title}-${suggestion.description}`;
    if (titleCache.has(cacheKey)) {
      setProcessedSuggestions(prev => {
        const updated = [...prev];
        updated[index] = {
          ...suggestion,
          optimizedTitle: titleCache.get(cacheKey)!
        };
        return updated;
      });
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

      setProcessedSuggestions(prev => {
        const updated = [...prev];
        updated[index] = {
          ...suggestion,
          optimizedTitle
        };
        return updated;
      });
    } catch (error) {
      console.error('Error generating title:', error);
      setProcessedSuggestions(prev => {
        const updated = [...prev];
        updated[index] = {
          ...suggestion,
          optimizedTitle: suggestion.title
        };
        return updated;
      });
    }
  }, []);

  useEffect(() => {
    if (suggestions.length === 0) return;
    
    // Initialize array with null titles to maintain order
    setProcessedSuggestions(suggestions.map(suggestion => ({
      ...suggestion,
      optimizedTitle: null
    })));
    
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
      {processedSuggestions.map((suggestion, index) => {
        if (!suggestion.optimizedTitle) {
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

        const price = suggestion.amazon_price 
          ? suggestion.amazon_price.toString()
          : suggestion.priceRange?.replace('USD ', '') || 'Check price on Amazon';

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
              title={suggestion.optimizedTitle}
              description={suggestion.description}
              price={price}
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