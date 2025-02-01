import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductCard } from '../ProductCard';
import { SuggestionSkeleton } from '../SuggestionSkeleton';
import { GiftSuggestion } from '@/types/suggestions';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface SuggestionsGridItemsProps {
  suggestions: GiftSuggestion[];
  onMoreLikeThis: (title: string) => void;
  isLoading: boolean;
  onAllSuggestionsProcessed: (allProcessed: boolean) => void;
}

export const SuggestionsGridItems = ({
  suggestions,
  onMoreLikeThis,
  isLoading,
  onAllSuggestionsProcessed
}: SuggestionsGridItemsProps) => {
  const [optimizedTitles, setOptimizedTitles] = useState<Record<string, string>>({});
  const abortController = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const generateTitle = useCallback(async (originalTitle: string, description: string) => {
    if (!originalTitle) {
      console.log('Empty title received, skipping optimization');
      return null;
    }

    try {
      console.log('Generating title for:', { originalTitle, description });
      
      const { data, error } = await supabase.functions.invoke('generate-product-title', {
        body: { 
          title: originalTitle.trim(),
          description: description?.trim() 
        }
      });

      if (error) {
        console.error('Error generating title:', error);
        return null;
      }

      return data?.title || null;
    } catch (error) {
      console.error('Error generating title:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!Array.isArray(suggestions)) {
      console.error('Invalid suggestions array:', suggestions);
      return;
    }

    console.log('Processing suggestions:', suggestions);

    if (suggestions.length === 0) {
      setOptimizedTitles({});
      onAllSuggestionsProcessed(false);
      return;
    }

    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    let completedCount = 0;

    const optimizeTitles = async () => {
      for (const suggestion of suggestions) {
        if (abortController.current?.signal.aborted) {
          break;
        }

        try {
          const optimizedTitle = await generateTitle(
            suggestion.title || 'Gift Suggestion',
            suggestion.description || ''
          );

          if (optimizedTitle) {
            setOptimizedTitles(prev => ({
              ...prev,
              [suggestion.title]: optimizedTitle
            }));
          }

          completedCount++;
          if (completedCount === suggestions.length) {
            onAllSuggestionsProcessed(true);
          }

        } catch (error) {
          console.error('Error processing suggestion:', error);
          completedCount++;
        }
      }
    };

    optimizeTitles();

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      onAllSuggestionsProcessed(false);
    };
  }, [suggestions, generateTitle, onAllSuggestionsProcessed]);

  if (isLoading) {
    return (
      <>
        {Array.from({ length: 8 }).map((_, index) => (
          <div 
            key={`skeleton-${index}`} 
            className="animate-in fade-in duration-300 ease-out"
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
        const optimizedTitle = suggestion.title ? optimizedTitles[suggestion.title] : null;

        return (
          <div 
            key={`suggestion-${index}`}
            className={`
              animate-in fade-in slide-in-from-bottom duration-300
            `}
            style={{ 
              animationDelay: `${Math.min(index * 100, 500)}ms`
            }}
          >
            <ProductCard
              title={optimizedTitle || suggestion.title}
              description={suggestion.description}
              price={suggestion.amazon_price 
                ? suggestion.amazon_price.toString()
                : suggestion.priceRange?.replace('USD ', '') || 'Check price on Amazon'}
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