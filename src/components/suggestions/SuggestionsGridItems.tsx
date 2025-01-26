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
      console.log('Starting incremental processing of suggestions');

      // Initialize array with placeholders
      setProcessedSuggestions(new Array(suggestions.length).fill(null));

      // Process each suggestion individually
      suggestions.forEach(async (suggestion, index) => {
        try {
          setProcessingIndexes(prev => new Set([...prev, index]));

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

          console.log(`Processed suggestion ${index + 1}/${suggestions.length}`);
        } catch (error) {
          if (error.message !== 'Processing aborted') {
            console.error(`Error processing suggestion ${index}:`, error);
          }
        }
      });

      const duration = performance.now() - startTime;
      console.log(`Processing started, total setup time: ${duration.toFixed(2)}ms`);
    };

    processSuggestions();

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [suggestions, generateTitle]);

  if (isLoading && suggestions.length === 0) {
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