
import { Star } from "lucide-react";

interface ProductCardContentProps {
  description: string;
  price: string | number;
  rating?: number;
  totalRatings?: number;
  title: string;
}

const formatPrice = (price: string | number | undefined): string => {
  // If price is undefined or null, return default message
  if (price === undefined || price === null) {
    return 'Check price on Amazon';
  }
  
  // If price is already a number, format it
  if (typeof price === 'number' && !isNaN(price)) {
    return `USD ${Math.floor(price)}`;
  }
  
  // If price is a string, try to parse it
  if (typeof price === 'string') {
    // If it's our default message, return as is
    if (price === 'Check price on Amazon') {
      return price;
    }
    
    // If it already has USD, clean and format
    if (price.includes('USD')) {
      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
      if (!isNaN(numericPrice)) {
        return `USD ${Math.floor(numericPrice)}`;
      }
    }
    
    // Try to parse the string as a number
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    if (!isNaN(numericPrice)) {
      return `USD ${Math.floor(numericPrice)}`;
    }
  }

  return 'Check price on Amazon';
};

export const ProductCardContent = ({ 
  description, 
  price, 
  rating, 
  totalRatings,
  title 
}: ProductCardContentProps) => {
  const formattedPrice = formatPrice(price);

  return (
    <div className="p-3 sm:p-4 pt-2 flex-grow flex flex-col">
      <p className="text-xs sm:text-sm leading-relaxed line-clamp-3 text-muted-foreground mb-auto font-medium tracking-wide">
        {description}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <p 
          className="text-sm sm:text-base font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent transition-all duration-300 hover:from-blue-500 hover:to-purple-600" 
          aria-label={`Price: ${formattedPrice}`}
        >
          {formattedPrice}
        </p>
        {rating && (
          <div 
            className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-md shadow-sm" 
            aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars from ${totalRatings?.toLocaleString()} reviews`}
          >
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              {rating.toFixed(1)} <span className="text-gray-500">({totalRatings?.toLocaleString()})</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
