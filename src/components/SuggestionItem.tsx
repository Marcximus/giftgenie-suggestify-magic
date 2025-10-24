import { ProductCard } from './ProductCard';
import { GiftSuggestion } from '@/types/suggestions';
import { memo, useEffect, useState } from 'react';
import { generateCustomDescription } from '@/utils/descriptionUtils';

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
  const [description, setDescription] = useState<string>(
    cachedDescription || suggestion.description
  );
  
  useEffect(() => {
    if (cachedDescription) {
      setDescription(cachedDescription);
      return;
    }
    
    const fetchDescription = async () => {
      try {
        if (suggestion.title) {
          const customDescription = await generateCustomDescription(
            suggestion.title, 
            suggestion.description
          );
          
          if (customDescription) {
            setDescription(customDescription);
          }
        }
      } catch (error) {
        console.error('Error generating description:', error);
      }
    };
    
    fetchDescription();
  }, [suggestion.title, suggestion.description, cachedDescription]);

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
        description={description}
        price={suggestion.amazon_price 
          ? suggestion.amazon_price.toString()
          : suggestion.priceRange?.replace('USD ', '') || 'Check price on Amazon'}
        amazonUrl={suggestion.amazon_url || "#"}
        imageUrl={suggestion.amazon_image_url}
        rating={suggestion.amazon_rating}
        totalRatings={suggestion.amazon_total_ratings}
        asin={suggestion.amazon_asin}
        onMoreLikeThis={onMoreLikeThis}
        suggestion={suggestion}
      />
    </div>
  );
});
