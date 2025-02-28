
import { ProductCard } from '../ProductCard';
import { GiftSuggestion } from '@/types/suggestions';

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
  // Ensure we never pass undefined as the description
  const fallbackDescription = suggestion.description || suggestion.title || '';
  
  // Use the custom description if available and valid, otherwise use the original description
  const displayDescription = (typeof customDescription === 'string' && customDescription.length > 0) 
    ? customDescription 
    : fallbackDescription;
  
  console.log('SuggestionItem rendering:', {
    title: suggestion.title,
    originalDescription: suggestion.description,
    customDescription,
    displayDescription,
    customDescriptionType: customDescription !== undefined ? typeof customDescription : 'undefined'
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
