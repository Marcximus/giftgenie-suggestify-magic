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

  // Split on common delimiters
  const parts = cleanTitle.split(/[|–—\-,]|\s*\(|\)\s*/).map(part => part.trim());
  
  // Filter out empty parts and common marketing phrases
  const meaningfulParts = parts.filter(part => {
    const lower = part.toLowerCase();
    return part.length > 0 &&
           !lower.includes('click here') &&
           !lower.includes('buy now') &&
           !lower.includes('limited time') &&
           !lower.includes('best seller') &&
           !lower.includes('on sale');
  });

  // Try to find the most descriptive part
  let bestPart = meaningfulParts[0];
  let maxScore = 0;

  for (const part of meaningfulParts) {
    const words = part.split(' ');
    // Score based on number of words and presence of key product terms
    let score = words.length;
    
    // Boost score for parts containing product type words
    const productTypes = ['bag', 'watch', 'phone', 'camera', 'book', 'game', 'set', 'kit'];
    if (productTypes.some(type => part.toLowerCase().includes(type))) {
      score += 3;
    }
    
    // Boost score for brand names followed by product type
    if (/^[A-Z][a-zA-Z]+ /.test(part) && words.length >= 3) {
      score += 2;
    }

    if (score > maxScore) {
      maxScore = score;
      bestPart = part;
    }
  }

  // If the best part is too short, try combining with next meaningful part
  if (bestPart.split(' ').length < 3 && meaningfulParts.length > 1) {
    const combinedTitle = `${bestPart} ${meaningfulParts[1]}`.trim();
    if (combinedTitle.split(' ').length <= 8) {
      bestPart = combinedTitle;
    }
  }

  // Ensure the title isn't too long
  const words = bestPart.split(' ');
  const finalTitle = words.slice(0, 8).join(' ');

  // Add product type if missing
  const lower = finalTitle.toLowerCase();
  const commonTypes = ['bag', 'watch', 'phone', 'camera', 'book', 'game', 'set', 'kit'];
  if (!commonTypes.some(type => lower.includes(type)) && meaningfulParts.length > 1) {
    for (const part of meaningfulParts.slice(1)) {
      if (commonTypes.some(type => part.toLowerCase().includes(type))) {
        return `${finalTitle} ${part}`.split(' ').slice(0, 8).join(' ');
      }
    }
  }

  return finalTitle;
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