import { ProductCard } from '../ProductCard';
import { GiftSuggestion } from '@/types/suggestions';

interface AnimatedSuggestionCardProps {
  suggestion: GiftSuggestion;
  index: number;
  visibleCount: number;
  optimizedTitle?: string;
  customDescription?: string;
  onMoreLikeThis: (title: string) => void;
}

export const AnimatedSuggestionCard = ({
  suggestion,
  index,
  visibleCount,
  optimizedTitle,
  customDescription,
  onMoreLikeThis
}: AnimatedSuggestionCardProps) => {
  return (
    <div 
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
};