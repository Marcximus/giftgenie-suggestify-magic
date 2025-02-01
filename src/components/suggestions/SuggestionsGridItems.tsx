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

  // Cleanup function to clear all timeouts
  const clearAllTimeouts = useCallback(() => {
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
        return null;
      }

      return data?.title || null;
    } catch (error) {
      console.error('Error generating title:', error);
      return null;
    }
  }, [processingQueue]);

  // Reset state when suggestions change
  useEffect(() => {
    clearAllTimeouts();
    setVisibleCount(0);
    onAllSuggestionsProcessed(false);
    
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return;
    }

    // Start processing suggestions
    const newProcessingQueue = new Set<string>();
    let completedCount = 0;

    const processSuggestions = async () => {
      const processPromises = suggestions.map(async (suggestion, index) => {
        const originalTitle = suggestion.title || 'Gift Suggestion';
        
        if (processingQueue.has(originalTitle) || optimizedTitles[originalTitle]) {
          return;
        }

        newProcessingQueue.add(originalTitle);

        try {
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
          
          // Add to visible items with staggered delay
          const timeout = setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + 1, suggestions.length));
            
            // If this was the last item, wait a bit then mark all as processed
            if (completedCount === suggestions.length) {
              const finalTimeout = setTimeout(() => {
                onAllSuggestionsProcessed(true);
              }, 300); // Wait for final animation
              timeoutsRef.current.push(finalTimeout);
            }
          }, index * 50); // 50ms stagger between items
          
          timeoutsRef.current.push(timeout);

        } catch (error) {
          console.error('Error processing suggestion:', error);
          completedCount++;
          newProcessingQueue.delete(originalTitle);
        }
      });

      await Promise.all(processPromises);
      setProcessingQueue(newProcessingQueue);
    };

    processSuggestions();

    return () => {
      clearAllTimeouts();
    };
  }, [suggestions, generateTitle, onAllSuggestionsProcessed, clearAllTimeouts, processingQueue, optimizedTitles]);

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
        const optimizedTitle = suggestion.title ? optimizedTitles[suggestion.title] : null;
        const customDescription = suggestion.title ? customDescriptions[suggestion.title] : suggestion.description;

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