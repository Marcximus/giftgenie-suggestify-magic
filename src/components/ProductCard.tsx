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
  // Remove common Amazon-specific phrases
  return title
    .replace(/\s*\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/,.*$/, '') // Remove everything after the first comma
    .replace(/\s*-.*$/, '') // Remove everything after a dash
    .replace(/\s*\|.*$/, '') // Remove everything after a pipe
    .replace(/\s{2,}/g, ' ') // Remove extra spaces
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
    <Card className="group h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 border-accent/20 backdrop-blur-sm bg-white/80 hover:bg-white/90">
      <CardHeader className="p-0 flex-none">
        <ProductImage 
          title={simplifiedTitle} 
          description={cleanedDescription} 
          imageUrl={imageUrl} 
        />
        <div className="h-[1.75rem] overflow-hidden mt-2 px-2 sm:px-3">
          <CardTitle className="text-xs sm:text-sm truncate text-center group-hover:text-primary transition-colors duration-200">
            {simplifiedTitle}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-3 pt-1 flex-grow flex flex-col">
        <p className="text-[0.65rem] sm:text-[0.7rem] leading-relaxed line-clamp-3 text-muted-foreground mb-auto">
          {cleanedDescription}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs sm:text-sm font-bold text-primary">{formatPrice(price)}</p>
          {rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">
                {rating.toFixed(1)} ({totalRatings?.toLocaleString()})
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-2 sm:p-3 pt-0 flex flex-col gap-1.5 flex-none">
        <AmazonButton title={simplifiedTitle} asin={asin} />
        <Button 
          variant="outline" 
          size="sm"
          className="w-full text-[0.65rem] h-7 opacity-70 hover:opacity-100"
          onClick={() => onMoreLikeThis?.(title)}
        >
          <Wand2 className="w-2.5 h-2.5 mr-1" />
          More like this
        </Button>
      </CardFooter>
    </Card>
  );
};

export const ProductCard = memo(ProductCardComponent);
