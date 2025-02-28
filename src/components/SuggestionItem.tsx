
import { ProductCard } from './ProductCard';
import { GiftSuggestion } from '@/types/suggestions';
import { getDescriptionFromCache } from '@/utils/descriptionUtils';

interface SuggestionItemProps {
  suggestion: GiftSuggestion;
  index: number;
  customDescription?: string;
  onMoreLikeThis: (title: string) => void;
}

export const SuggestionItem = ({ 
  suggestion, 
  index, 
  customDescription, 
  onMoreLikeThis 
}: SuggestionItemProps) => {
  // First try the passed customDescription, then check cache, finally fallback to original
  const cachedDescription = suggestion.title ? getDescriptionFromCache(suggestion.title) : null;
  const displayDescription = customDescription || cachedDescription || suggestion.description;
  
  console.log('SuggestionItem rendering:', {
    title: suggestion.title,
    originalDescription: suggestion.description,
    customDescription,
    cachedDescription,
    displayDescription
  });

  return (
    <div 
      key={`suggestion-${index}-${suggestion.amazon_asin || suggestion.title}`}
      className="animate-in fade-in slide-in-from-bottom duration-300"
      style={{ 
        animationDelay: `${Math.min(index * 100, 500)}ms`
      }}
    >
      <ProductCard
        title={suggestion.title}
        description={displayDescription}
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
};
