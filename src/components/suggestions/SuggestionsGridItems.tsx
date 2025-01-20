import { ProductCard } from '../ProductCard';
import { SuggestionSkeleton } from '../SuggestionSkeleton';
import { GiftSuggestion } from '@/types/suggestions';

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
        console.log('Processing suggestion for ProductCard:', {
          title: suggestion.title,
          hasAmazonPrice: suggestion.amazon_price !== undefined,
          amazonPrice: suggestion.amazon_price,
          priceRange: suggestion.priceRange,
          finalPrice: suggestion.amazon_price ? suggestion.amazon_price.toString() : suggestion.priceRange
        });

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
              title={suggestion.title}
              description={suggestion.description}
              price={suggestion.amazon_price ? suggestion.amazon_price.toString() : suggestion.priceRange}
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