import { Star } from "lucide-react";
import { memo } from 'react';

interface ProductCardContentProps {
  description: string;
  price: string | number;
  rating?: number;
  totalRatings?: number;
}

// Memoize the price formatting component
const FormattedPrice = memo(({ price }: { price: string | number }) => {
  const formattedPrice = (() => {
    if (price === undefined || price === null) {
      return 'Check price on Amazon';
    }
    
    if (typeof price === 'number' && !isNaN(price)) {
      return `USD ${Math.floor(price)}`;
    }
    
    if (typeof price === 'string') {
      if (price === 'Check price on Amazon') {
        return price;
      }
      
      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
      if (!isNaN(numericPrice)) {
        return `USD ${Math.floor(numericPrice)}`;
      }
    }

    return 'Check price on Amazon';
  })();

  return (
    <p 
      className="text-sm sm:text-base font-bold bg-gradient-to-r from-[#9b87f5] to-[#847bd1] bg-clip-text text-transparent" 
      aria-label={`Price: ${formattedPrice}`}
    >
      {formattedPrice}
    </p>
  );
});

FormattedPrice.displayName = 'FormattedPrice';

// Memoize the rating component
const ProductRating = memo(({ rating, totalRatings }: { rating?: number; totalRatings?: number }) => {
  if (!rating) return null;

  return (
    <div 
      className="flex items-center gap-1.5" 
      aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars from ${totalRatings?.toLocaleString()} reviews`}
    >
      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
      <span className="text-xs sm:text-sm text-muted-foreground">
        {rating.toFixed(1)} ({totalRatings?.toLocaleString()})
      </span>
    </div>
  );
});

ProductRating.displayName = 'ProductRating';

const formatDescription = (description: string | undefined): string => {
  if (!description) return 'No description available';
  
  const cleanDescription = description
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanDescription.length < 100) return cleanDescription;

  const sentences = cleanDescription
    .split(/[.!?]+/)
    .filter(s => s.trim().length > 0)
    .filter(sentence => {
      const lower = sentence.toLowerCase().trim();
      return !lower.includes('click here') &&
             !lower.includes('buy now') &&
             !lower.includes('limited time') &&
             !lower.includes('check price') &&
             sentence.length > 20;
    })
    .slice(0, 3);

  let finalDescription = sentences.join('. ').trim();
  if (!finalDescription.endsWith('.')) {
    finalDescription += '.';
  }

  return finalDescription || 'No description available';
};

export const ProductCardContent = memo(({ 
  description, 
  price, 
  rating, 
  totalRatings 
}: ProductCardContentProps) => {
  return (
    <div className="p-3 sm:p-4 pt-2 flex-grow flex flex-col">
      <p className="text-xs sm:text-sm leading-relaxed line-clamp-3 text-muted-foreground mb-auto">
        {formatDescription(description)}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <FormattedPrice price={price} />
        <ProductRating rating={rating} totalRatings={totalRatings} />
      </div>
    </div>
  );
});

ProductCardContent.displayName = 'ProductCardContent';