import { GiftSuggestion } from '@/types/suggestions';
import { ProductCard } from '../ProductCard';
import { SuggestionSkeleton } from '../SuggestionSkeleton';

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
  console.log('SuggestionsGridItems received suggestions:', suggestions);
  console.log('isLoading:', isLoading);

  if (isLoading) {
    return (
      <>
        {[...Array(8)].map((_, index) => (
          <SuggestionSkeleton key={`skeleton-${index}`} />
        ))}
      </>
    );
  }

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    console.log('No suggestions to display');
    return null;
  }

  return (
    <>
      {suggestions.map((suggestion, index) => {
        console.log(`Processing suggestion ${index}:`, suggestion);
        return (
          <ProductCard
            key={`product-${index}`}
            title={suggestion.title}
            description={suggestion.description}
            price={suggestion.amazon_price?.toString() || suggestion.priceRange}
            amazonUrl={suggestion.amazon_url || "#"}
            imageUrl={suggestion.amazon_image_url}
            rating={suggestion.amazon_rating}
            totalRatings={suggestion.amazon_total_ratings}
            asin={suggestion.amazon_asin}
            onMoreLikeThis={onMoreLikeThis}
          />
        );
      })}
    </>
  );
};