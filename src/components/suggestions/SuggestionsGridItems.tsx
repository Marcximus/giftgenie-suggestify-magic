import { ProductCard } from '../ProductCard';
import { SuggestionSkeleton } from '../SuggestionSkeleton';
import { GiftSuggestion } from '@/types/suggestions';
import { memo, useEffect, useState } from 'react';

// Memoized individual suggestion item
const SuggestionItem = memo(({ 
  suggestion, 
  index,
  onMoreLikeThis 
}: { 
  suggestion: GiftSuggestion; 
  index: number;
  onMoreLikeThis: (title: string) => void;
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, index * 100); // Stagger the appearance

    return () => clearTimeout(timer);
  }, [index]);

  if (!isVisible) return null;

  return (
    <div 
      className="animate-in fade-in slide-in-from-bottom-4"
      style={{ 
        animationDelay: `${index * 100}ms`,
        animationFillMode: 'forwards' 
      }}
    >
      <ProductCard
        title={suggestion.title}
        description={suggestion.description}
        price={suggestion.amazon_price || suggestion.priceRange?.replace('USD ', '') || 'Check price on Amazon'}
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

SuggestionItem.displayName = 'SuggestionItem';

// Main component with progressive loading
const SuggestionsGridItemsComponent = ({
  suggestions,
  onMoreLikeThis,
  isLoading
}: {
  suggestions: GiftSuggestion[];
  onMoreLikeThis: (title: string) => void;
  isLoading: boolean;
}) => {
  // Show loading skeletons only when no suggestions are available
  if (isLoading && suggestions.length === 0) {
    return (
      <>
        {Array.from({ length: 4 }).map((_, index) => (
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
      {suggestions.map((suggestion, index) => (
        <SuggestionItem
          key={`${suggestion.title}-${index}`}
          suggestion={suggestion}
          index={index}
          onMoreLikeThis={onMoreLikeThis}
        />
      ))}
      
      {/* Show single skeleton for loading more */}
      {isLoading && suggestions.length > 0 && (
        <div 
          className="animate-in fade-in slide-in-from-bottom-4"
          style={{ animationDelay: `${suggestions.length * 100}ms` }}
          aria-hidden="true"
        >
          <SuggestionSkeleton />
        </div>
      )}
    </>
  );
};

SuggestionsGridItemsComponent.displayName = 'SuggestionsGridItems';

export const SuggestionsGridItems = memo(SuggestionsGridItemsComponent);