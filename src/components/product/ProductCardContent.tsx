import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { generateCustomDescription } from "@/utils/descriptionUtils";

interface ProductCardContentProps {
  description: string;
  price: string | number;
  rating?: number;
  totalRatings?: number;
  title: string;
}

const formatPrice = (price: string | number | undefined): string => {
  console.log('Formatting price:', {
    price,
    type: typeof price,
    rawValue: price
  });

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

const formatDescription = (description: string | undefined): string => {
  if (!description) return 'No description available';

  // Remove any HTML tags
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

  return finalDescription || 'No description available';
};

export const ProductCardContent = ({ 
  description, 
  price, 
  rating, 
  totalRatings,
  title 
}: ProductCardContentProps) => {
  const [customDescription, setCustomDescription] = useState(description);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomDescription = async () => {
      try {
        const enhancedDescription = await generateCustomDescription(title, description);
        setCustomDescription(enhancedDescription);
      } catch (error) {
        console.error('Error generating custom description:', error);
        // Fallback to original description if generation fails
        setCustomDescription(description);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomDescription();
  }, [title, description]);

  const formattedPrice = formatPrice(price);

  return (
    <div className="p-3 sm:p-4 pt-2 flex-grow flex flex-col">
      <p className={`text-xs sm:text-sm leading-relaxed line-clamp-3 text-muted-foreground mb-auto ${
        isLoading ? 'animate-pulse bg-gray-100 rounded' : ''
      }`}>
        {customDescription}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <p 
          className="text-sm sm:text-base font-bold bg-gradient-to-r from-[#9b87f5] to-[#847bd1] bg-clip-text text-transparent" 
          aria-label={`Price: ${formattedPrice}`}
        >
          {formattedPrice}
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