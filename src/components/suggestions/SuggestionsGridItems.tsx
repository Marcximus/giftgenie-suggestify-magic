import { useState, useEffect, useCallback } from 'react';
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
  const [processingQueue, setProcessingQueue] = useState<number[]>([]);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<number | null>(null);

  const generateTitle = useCallback(async (originalTitle: string, description: string) => {
    try {
      console.log('Generating title for:', originalTitle);
      const startTime = performance.now();
      
      const { data, error } = await supabase.functions.invoke('generate-product-title', {
        body: { title: originalTitle, description }
      });

      const endTime = performance.now();
      console.log(`Title generation took ${endTime - startTime}ms`);

      if (error) {
        console.error('Error generating title:', error);
        return originalTitle;
      }

      return data?.title || originalTitle;
    } catch (error) {
      console.error('Error in title generation:', error);
      return originalTitle;
    }
  }, []);

  // Initialize processing queue when suggestions change
  useEffect(() => {
    if (suggestions.length === 0) return;
    
    const indices = Array.from({ length: suggestions.length }, (_, i) => i);
    setProcessingQueue(indices);
    setProcessedSuggestions([]);
    setCurrentlyProcessing(null);
  }, [suggestions]);

  // Process queue
  useEffect(() => {
    const processNextInQueue = async () => {
      if (processingQueue.length === 0 || currentlyProcessing !== null) return;

      const index = processingQueue[0];
      const suggestion = suggestions[index];

      if (!suggestion) {
        console.warn('Invalid suggestion at index:', index);
        setProcessingQueue(prev => prev.slice(1));
        return;
      }

      setCurrentlyProcessing(index);
      console.log('Processing suggestion:', index);

      try {
        const optimizedTitle = await generateTitle(suggestion.title, suggestion.description);
        
        setProcessedSuggestions(prev => {
          const newSuggestions = [...prev];
          newSuggestions[index] = { ...suggestion, optimizedTitle };
          return newSuggestions;
        });
      } catch (error) {
        console.error('Error processing suggestion:', error);
      } finally {
        setCurrentlyProcessing(null);
        setProcessingQueue(prev => prev.slice(1));
      }
    };

    processNextInQueue();
  }, [processingQueue, currentlyProcessing, suggestions, generateTitle]);

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
        const isProcessing = !processed && (currentlyProcessing === index || processingQueue.includes(index));

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

        if (!processed) {
          console.warn('Suggestion not yet processed:', index);
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