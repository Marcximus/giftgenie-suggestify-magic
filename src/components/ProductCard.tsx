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

  // Extract the main part of the title by focusing on the product name
  const parts = cleanTitle.split(/[–—-]|\(|\)|,/); // Split on dashes, parentheses, commas
  
  // Get the first part as it usually contains the main product name
  let mainTitle = parts[0].trim();
  
  // If the first part is too short (less than 3 words), try to find a better part
  if (mainTitle.split(' ').length < 3) {
    // Look for a part that has 3-8 words and doesn't contain common suffixes
    mainTitle = parts.find(part => {
      const words = part.trim().split(' ');
      return words.length >= 3 && 
             words.length <= 8 && 
             !part.toLowerCase().includes('with') &&
             !part.toLowerCase().includes('featuring') &&
             !part.toLowerCase().includes('includes');
    }) || mainTitle;
  }

  // Ensure the title isn't too long
  const words = mainTitle.split(' ');
  return words.slice(0, 8).join(' ').trim();
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