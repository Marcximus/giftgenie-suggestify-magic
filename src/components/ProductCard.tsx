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
  return title
    .replace(/\s*\([^)]*\)/g, '') // Remove text in parentheses
    .replace(/,.*$/, '') // Remove everything after comma
    .replace(/\s*-.*$/, '') // Remove everything after dash
    .replace(/\s*\|.*$/, '') // Remove everything after pipe
    .replace(/\s{2,}/g, ' ') // Remove extra spaces
    .split(' ') // Split into words
    .slice(0, 6) // Take first 6 words
    .join(' ') // Join back together
    .trim();
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking the "More like this" button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    // Always construct a direct product URL using the ASIN
    const productUrl = `https://www.amazon.com/dp/${asin}/ref=nosim?tag=${import.meta.env.VITE_AMAZON_ASSOCIATE_ID}`;
    window.open(productUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card 
      className="group h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 border-accent/20 backdrop-blur-sm bg-white/80 hover:bg-white/90 cursor-pointer"
      role="article"
      aria-label={`Product: ${simplifiedTitle}`}
      onClick={handleCardClick}
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