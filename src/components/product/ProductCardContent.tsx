import { Star } from "lucide-react";

interface ProductCardContentProps {
  description: string;
  price: string;
  rating?: number;
  totalRatings?: number;
}

const formatPrice = (price: string | number): string => {
  if (typeof price === 'string' && (price.startsWith('$') || price.startsWith('USD'))) {
    return price;
  }

  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numericPrice)) {
    return 'Price unavailable';
  }

  return `USD ${numericPrice.toFixed(2)}`;
};

const formatDescription = (description: string): string => {
  // Remove any HTML tags that might come from Amazon
  const cleanDescription = description.replace(/<[^>]*>/g, '');
  
  // Remove multiple spaces and normalize whitespace
  const normalizedDescription = cleanDescription
    .replace(/\s+/g, ' ')
    .trim();

  // If it's a very short description, return it as is
  if (normalizedDescription.length < 100) {
    return normalizedDescription;
  }

  // Split into sentences
  const sentences = normalizedDescription.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Take the first 2-3 meaningful sentences
  const meaningfulSentences = sentences
    .filter(sentence => {
      const lower = sentence.toLowerCase().trim();
      return !lower.includes('click here') &&
             !lower.includes('buy now') &&
             !lower.includes('limited time') &&
             !lower.includes('check price') &&
             sentence.length > 20;
    })
    .slice(0, 3);

  // Join sentences and ensure it ends with a period
  let finalDescription = meaningfulSentences.join('. ').trim();
  if (!finalDescription.endsWith('.')) {
    finalDescription += '.';
  }

  return finalDescription;
};

export const ProductCardContent = ({ 
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
        <p 
          className="text-sm sm:text-base font-bold text-primary" 
          aria-label={`Price: ${formatPrice(price)}`}
        >
          {formatPrice(price)}
        </p>
        {rating && (
          <div 
            className="flex items-center gap-1.5" 
            aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars from ${totalRatings?.toLocaleString()} reviews`}
          >
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
            <span className="text-xs sm:text-sm text-muted-foreground">
              {rating.toFixed(1)} ({totalRatings?.toLocaleString()})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};