import { useState, useEffect } from 'react';
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
  const [processingCount, setProcessingCount] = useState(0);

  const generateTitle = async (originalTitle: string, description: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-title', {
        body: { title: originalTitle, description }
      });

      if (error) {
        console.error('Error generating title:', error);
        return originalTitle;
      }

      return data?.title || originalTitle;
    } catch (error) {
      console.error('Error in title generation:', error);
      return originalTitle;
    }
  };

  useEffect(() => {
    if (suggestions.length === 0) return;
    
    setProcessingCount(suggestions.length);
    setProcessedSuggestions([]); // Reset when new suggestions come in

    // Process each suggestion individually
    suggestions.forEach(async (suggestion, index) => {
      if (!suggestion) {
        console.warn('Received undefined suggestion at index:', index);
        setProcessingCount(count => count - 1);
        return;
      }

      try {
        console.log('Processing suggestion:', {
          title: suggestion.title,
          amazonPrice: suggestion.amazon_price,
          priceRange: suggestion.priceRange
        });

        const optimizedTitle = await generateTitle(suggestion.title, suggestion.description);
        
        setProcessedSuggestions(prev => {
          const newSuggestions = [...prev];
          newSuggestions[index] = { ...suggestion, optimizedTitle };
          return newSuggestions;
        });
        
        setProcessingCount(count => count - 1);
      } catch (error) {
        console.error('Error processing suggestion:', error);
        setProcessingCount(count => count - 1);
      }
    });
  }, [suggestions]);

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

  // Show skeletons for items still being processed
  const remainingSkeletons = processingCount;
  const processedCount = suggestions.length - processingCount;

  return (
    <>
      {processedSuggestions
        .slice(0, processedCount)
        .map((suggestion, index) => {
          if (!suggestion) {
            console.warn('Encountered undefined processed suggestion at index:', index);
            return null;
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
      
      {remainingSkeletons > 0 && Array.from({ length: remainingSkeletons }).map((_, index) => (
        <div 
          key={`remaining-skeleton-${index}`}
          className="animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: `${(processedCount + index) * 100}ms` }}
        >
          <SuggestionSkeleton />
        </div>
      ))}
    </>
  );
};