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

  // Extract the main part of the title
  const mainTitle = cleanTitle
    .split(/[,|\-\(\)]/) // Split on common separators
    .map(part => part.trim()) // Trim each part
    .filter(part => part.length > 0) // Remove empty parts
    .reduce((longest, current) => {
      // Keep the longest meaningful part
      return (current.length > longest.length && current.split(' ').length >= 2) 
        ? current 
        : longest;
    }, cleanTitle.split(/[,|\-\(\)]/)[0].trim());

  // Take up to 8 words, but ensure we have at least 2
  const words = mainTitle.split(' ');
  const titleWords = words.length <= 2 ? words : words.slice(0, 8);
  
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
