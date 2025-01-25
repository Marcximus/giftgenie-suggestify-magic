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
  const [processingIndex, setProcessingIndex] = useState<number | null>(null);
  const processingQueue = useRef<number[]>([]);
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

  const processNextInQueue = useCallback(async () => {
    if (processingIndex !== null || processingQueue.current.length === 0) return;

    const index = processingQueue.current[0];
    const suggestion = suggestions[index];

    if (!suggestion) {
      processingQueue.current.shift();
      return;
    }

    setProcessingIndex(index);
    console.log('Processing suggestion:', index);

    try {
      abortController.current = new AbortController();
      const optimizedTitle = await generateTitle(suggestion.title, suggestion.description);
      
      if (!abortController.current.signal.aborted) {
        setProcessedSuggestions(prev => {
          const newSuggestions = [...prev];
          newSuggestions[index] = { ...suggestion, optimizedTitle };
          return newSuggestions;
        });
      }
    } catch (error) {
      console.error('Error processing suggestion:', error);
    } finally {
      if (!abortController.current?.signal.aborted) {
        processingQueue.current.shift();
        setProcessingIndex(null);
      }
    }
  }, [processingIndex, suggestions, generateTitle]);

  useEffect(() => {
    if (suggestions.length === 0) return;
    
    // Reset state when suggestions change
    setProcessedSuggestions([]);
    setProcessingIndex(null);
    processingQueue.current = Array.from({ length: suggestions.length }, (_, i) => i);
    
    // Cleanup previous processing
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [suggestions]);

  useEffect(() => {
    processNextInQueue();
  }, [processNextInQueue, processingIndex]);

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
        const isProcessing = !processed && (processingIndex === index || processingQueue.current.includes(index));

        if (isProcessing) {
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

        if (!processed) return null;

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