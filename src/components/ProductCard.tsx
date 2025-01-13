import { memo } from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImage } from "./ProductImage";
import { ProductCardContent } from "./product/ProductCardContent";
import { ProductCardActions } from "./product/ProductCardActions";

interface Product {
  title: string;
  description: string;
  price: string;
  amazonUrl: string;
  imageUrl?: string;
  rating?: number;
  totalRatings?: number;
  asin?: string;
}

interface ProductCardProps extends Product {
  onMoreLikeThis?: (title: string) => void;
}

export const simplifyTitle = (title: string): string => {
  // First, clean up any HTML and extra spaces
  const cleanTitle = title
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s{2,}/g, ' ') // Remove extra spaces
    .trim();

  // Split the title into parts using common separators
  const parts = cleanTitle.split(/[,|\-–—]/).map(part => part.trim());

  // Find the most meaningful part (prioritize longer parts with multiple words)
  let bestPart = parts[0]; // Default to first part
  let bestScore = 0;

  for (const part of parts) {
    const words = part.split(' ').filter(word => word.length > 1);
    const score = words.length * 2 + part.length;
    
    // Prefer parts that look like actual product names
    // (more than one word and not just specifications)
    if (
      score > bestScore && 
      words.length >= 2 &&
      !part.match(/^\d+(?:gb|tb|inch|"|cm|mm)/i) // Avoid parts that start with specifications
    ) {
      bestPart = part;
      bestScore = score;
    }
  }

  // If the best part is too short or seems incomplete, use the original first part
  if (bestPart.length < 10 || bestPart.split(' ').length < 2) {
    bestPart = parts[0];
  }

  // Take up to 10 words, ensuring we have at least 2
  const words = bestPart.split(' ');
  const titleWords = words.length <= 2 ? words : words.slice(0, 10);
  
  // Ensure the title ends with a complete word
  return titleWords.join(' ').trim();
};

const ProductCardComponent = ({ 
  title, 
  description, 
  price, 
  rating,
  totalRatings,
  asin,
  imageUrl,
  onMoreLikeThis 
}: ProductCardProps) => {
  const simplifiedTitle = simplifyTitle(title);

  return (
    <Card 
      className="group h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 border-accent/20 backdrop-blur-sm bg-white/80 hover:bg-white/90"
      role="article"
      aria-label={`Product: ${simplifiedTitle}`}
    >
      <CardHeader className="p-0 flex-none">
        <ProductImage 
          title={simplifiedTitle} 
          description={description} 
          imageUrl={imageUrl} 
        />
        <div className="h-[1.75rem] overflow-hidden mt-2 px-3 sm:px-4">
          <CardTitle className="text-sm sm:text-base truncate text-center group-hover:text-primary transition-colors duration-200">
            {simplifiedTitle}
          </CardTitle>
        </div>
      </CardHeader>
      
      <ProductCardContent 
        description={description}
        price={price}
        rating={rating}
        totalRatings={totalRatings}
      />
      
      <ProductCardActions 
        title={simplifiedTitle}
        asin={asin}
        onMoreLikeThis={onMoreLikeThis}
      />
    </Card>
  );
};

export const ProductCard = memo(ProductCardComponent);