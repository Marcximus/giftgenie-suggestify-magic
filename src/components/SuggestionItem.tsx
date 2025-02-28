
import { ProductCard } from './ProductCard';
import { GiftSuggestion } from '@/types/suggestions';
import { getDescriptionFromCache } from '@/utils/descriptionUtils';
import { useMemo, memo } from 'react';

interface SuggestionItemProps {
  suggestion: GiftSuggestion;
  index: number;
  customDescription?: string;
  onMoreLikeThis: (title: string) => void;
}

export const SuggestionItem = memo(({ 
  suggestion, 
  index, 
  customDescription, 
  onMoreLikeThis 
}: SuggestionItemProps) => {
  // Use useMemo to stabilize the description between renders
  const displayDescription = useMemo(() => {
    // First try the passed customDescription, then check cache, finally fallback to original
    const cachedDescription = suggestion.title ? getDescriptionFromCache(suggestion.title) : null;
    const finalDescription = customDescription || cachedDescription || suggestion.description;
    
    console.log('SuggestionItem computing description:', {
      title: suggestion.title,
      source: customDescription ? 'prop' : (cachedDescription ? 'cache' : 'original'),
      displayDescription: finalDescription
    });
    
    return finalDescription;
  }, [suggestion.title, suggestion.description, customDescription]);

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
});
