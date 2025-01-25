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
      {suggestions.map(async (suggestion, index) => {
        console.log('Processing suggestion:', {
          title: suggestion.title,
          amazonPrice: suggestion.amazon_price,
          priceRange: suggestion.priceRange
        });

        // Generate optimized title
        const optimizedTitle = await generateTitle(suggestion.title, suggestion.description);

        // Only convert to string if we have a valid price
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
              title={optimizedTitle}
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