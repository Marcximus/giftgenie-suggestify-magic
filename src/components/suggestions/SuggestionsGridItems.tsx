import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductCard } from '../ProductCard';
import { SuggestionSkeleton } from '../SuggestionSkeleton';
import { GiftSuggestion } from '@/types/suggestions';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { generateCustomDescription } from "@/utils/descriptionUtils";

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
  const [customDescriptions, setCustomDescriptions] = useState<Record<string, string>>({});
  const [processingQueue, setProcessingQueue] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(0);
  const abortController = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const generateTitle = useCallback(async (originalTitle: string, description: string) => {
    if (!originalTitle || processingQueue.has(originalTitle)) {
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
  }, [processingQueue]);

  useEffect(() => {
    if (!Array.isArray(suggestions)) {
      console.error('Invalid suggestions array:', suggestions);
      return;
    }

    console.log('Processing suggestions:', suggestions);

    if (suggestions.length === 0) {
      setOptimizedTitles({});
      setCustomDescriptions({});
      onAllSuggestionsProcessed(false);
      setVisibleCount(0);
      return;
    }

    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    let completedCount = 0;
    const newProcessingQueue = new Set<string>();

    const processSuggestions = async () => {
      // Process all suggestions in parallel
      const processPromises = suggestions.map(async (suggestion, index) => {
        if (abortController.current?.signal.aborted) {
          return;
        }

        const originalTitle = suggestion.title || 'Gift Suggestion';
        
        // Skip if already processing or processed
        if (processingQueue.has(originalTitle) || optimizedTitles[originalTitle]) {
          return;
        }

        newProcessingQueue.add(originalTitle);

        try {
          // Start both title and description generation immediately
          const [optimizedTitle, customDescription] = await Promise.all([
            generateTitle(originalTitle, suggestion.description || ''),
            generateCustomDescription(originalTitle, suggestion.description || '')
          ]);

          if (optimizedTitle) {
            setOptimizedTitles(prev => ({
              ...prev,
              [originalTitle]: optimizedTitle
            }));
          }

          if (customDescription) {
            setCustomDescriptions(prev => ({
              ...prev,
              [originalTitle]: customDescription
            }));
          }

          completedCount++;
          
          // Increment visible count with a delay based on index
          setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + 1, suggestions.length));
          }, index * 200); // 200ms delay between each item

          if (completedCount === suggestions.length) {
            onAllSuggestionsProcessed(true);
          }

        } catch (error) {
          console.error('Error processing suggestion:', error);
          completedCount++;
        } finally {
          newProcessingQueue.delete(originalTitle);
        }
      });

      await Promise.all(processPromises);
      setProcessingQueue(newProcessingQueue);
    };

    processSuggestions();

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      onAllSuggestionsProcessed(false);
      setVisibleCount(0);
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
        const customDescription = suggestion.title ? customDescriptions[suggestion.title] : suggestion.description;

        return (
          <div 
            key={`suggestion-${index}`}
            className={`
              transform transition-all duration-500 ease-out
              ${index < visibleCount 
                ? 'translate-y-0 opacity-100' 
                : 'translate-y-4 opacity-0 pointer-events-none'
              }
            `}
            style={{ 
              transitionDelay: `${index * 200}ms`
            }}
          >
            <ProductCard
              title={optimizedTitle || suggestion.title}
              description={customDescription || suggestion.description}
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