import { memo } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductImage } from "./ProductImage";
import { AmazonButton } from "./AmazonButton";
import { Button } from "./ui/button";
import { Wand2, Star } from "lucide-react";

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

const cleanDescription = (description: string): string => {
  return description
    .split(/[.!?]\s+/)
    .filter(sentence => !sentence.trim().endsWith('?'))
    .join('. ')
    .trim();
};

const simplifyTitle = (title: string): string => {
  return title
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/,.*$/, '')
    .replace(/\s*-.*$/, '')
    .replace(/\s*\|.*$/, '')
    .replace(/\s{2,}/g, ' ')
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
  const cleanedDescription = cleanDescription(description);
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
          description={cleanedDescription} 
          imageUrl={imageUrl} 
        />
        <div className="h-[1.75rem] overflow-hidden mt-2 px-3 sm:px-4">
          <CardTitle className="text-sm sm:text-base truncate text-center group-hover:text-primary transition-colors duration-200">
            {simplifiedTitle}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-2 flex-grow flex flex-col">
        <p className="text-xs sm:text-sm leading-relaxed line-clamp-3 text-muted-foreground mb-auto">
          {cleanedDescription}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm sm:text-base font-bold text-primary" aria-label={`Price: ${formatPrice(price)}`}>
            {formatPrice(price)}
          </p>
          {rating && (
            <div className="flex items-center gap-1.5" aria-label={`Rating: ${rating.toFixed(1)} out of 5 stars from ${totalRatings?.toLocaleString()} reviews`}>
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
              <span className="text-xs sm:text-sm text-muted-foreground">
                {rating.toFixed(1)} ({totalRatings?.toLocaleString()})
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-0 flex flex-col gap-2 flex-none">
        <AmazonButton title={simplifiedTitle} asin={asin} />
        <Button 
          variant="outline" 
          size="default"
          className="w-full text-xs sm:text-sm opacity-70 hover:opacity-100 min-h-[2.75rem] touch-manipulation"
          onClick={() => onMoreLikeThis?.(title)}
          aria-label={`Find more products similar to ${simplifiedTitle}`}
        >
          <Wand2 className="w-3.5 h-3.5 mr-2" aria-hidden="true" />
          More like this
        </Button>
      </CardFooter>
    </Card>
  );
};

export const ProductCard = memo(ProductCardComponent);