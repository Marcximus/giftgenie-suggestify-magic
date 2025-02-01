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
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const { toast } = useToast();

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];
  }, []);

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
        return originalTitle; // Fallback to original title on error
      }

      return data?.title || originalTitle;
    } catch (error) {
      console.error('Error generating title:', error);
      return originalTitle; // Fallback to original title on error
    }
  }, [processingQueue]);

  useEffect(() => {
    // Reset state when suggestions change
    clearTimeouts();
    setVisibleCount(0);
    onAllSuggestionsProcessed(false);
    
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      console.log('No suggestions to process');
      return;
    }

    console.log('Processing suggestions:', suggestions.length);
    const newProcessingQueue = new Set<string>();

    const processSuggestions = async () => {
      // Show first item immediately
      setVisibleCount(1);

      for (let i = 0; i < suggestions.length; i++) {
        const suggestion = suggestions[i];
        const originalTitle = suggestion.title || 'Gift Suggestion';
        
        if (!processingQueue.has(originalTitle) && !optimizedTitles[originalTitle]) {
          newProcessingQueue.add(originalTitle);

          try {
            // Process title and description in parallel
            const [optimizedTitle, customDescription] = await Promise.all([
              generateTitle(originalTitle, suggestion.description || ''),
              generateCustomDescription(originalTitle, suggestion.description || '')
            ]);

            setOptimizedTitles(prev => ({
              ...prev,
              [originalTitle]: optimizedTitle || originalTitle
            }));

            if (customDescription) {
              setCustomDescriptions(prev => ({
                ...prev,
                [originalTitle]: customDescription
              }));
            }

            // Increment visible count with delay, except for first item
            if (i > 0) {
              const timeout = setTimeout(() => {
                setVisibleCount(prev => Math.min(prev + 1, suggestions.length));
              }, i * 50);
              timeoutsRef.current.push(timeout);
            }

          } catch (error) {
            console.error('Error processing suggestion:', error);
            // Still show the item even if processing fails
            setVisibleCount(prev => Math.min(prev + 1, suggestions.length));
          }
        }
      }

      // Set final visibility after all processing is complete
      const finalTimeout = setTimeout(() => {
        setVisibleCount(suggestions.length);
        onAllSuggestionsProcessed(true);
      }, suggestions.length * 50 + 300);
      
      timeoutsRef.current.push(finalTimeout);
      setProcessingQueue(newProcessingQueue);
    };

    processSuggestions().catch(error => {
      console.error('Error in processSuggestions:', error);
      // Ensure all items are visible even if there's an error
      setVisibleCount(suggestions.length);
      onAllSuggestionsProcessed(true);
    });

    return clearTimeouts;
  }, [suggestions, generateTitle, onAllSuggestionsProcessed, clearTimeouts, processingQueue, optimizedTitles]);

  if (isLoading) {
    return (
      <>
        {Array.from({ length: 8 }).map((_, index) => (
          <div 
            key={`skeleton-${index}`}
            className="animate-in fade-in duration-300 ease-out"
            style={{ animationDelay: `${index * 50}ms` }}
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
        const optimizedTitle = suggestion.title ? optimizedTitles[suggestion.title] || suggestion.title : suggestion.title;
        const customDescription = suggestion.title ? customDescriptions[suggestion.title] || suggestion.description : suggestion.description;

        return (
          <div 
            key={`suggestion-${index}`}
            className={`
              transform transition-all duration-300 ease-out
              ${index < visibleCount 
                ? 'translate-y-0 opacity-100' 
                : 'translate-y-4 opacity-0 pointer-events-none'
              }
            `}
            style={{ 
              transitionDelay: `${index * 50}ms`
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