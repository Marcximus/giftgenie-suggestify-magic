
import { ProductCard } from './ProductCard';
import { GiftSuggestion } from '@/types/suggestions';
import { memo, useMemo } from 'react';

interface SuggestionItemProps {
  suggestion: GiftSuggestion;
  index: number;
  cachedDescription?: string;
  onMoreLikeThis: (title: string) => void;
}

export const SuggestionItem = memo(({ 
  suggestion, 
  index, 
  cachedDescription, 
  onMoreLikeThis 
}: SuggestionItemProps) => {
  // Use the cached description or fall back to the original description
  const displayDescription = useMemo(() => {
    return cachedDescription || suggestion.description;
  }, [suggestion.description, cachedDescription]);

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
