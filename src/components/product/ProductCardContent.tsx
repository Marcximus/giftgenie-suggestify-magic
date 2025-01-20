import { memo } from "react";
import { transformPrice } from "@/utils/priceUtils";
import { cn } from "@/lib/utils";
import { ProductReview } from "./ProductReview";

interface ProductCardContentProps {
  title?: string;
  price?: string | number;
  description?: string;
  reason?: string;
  className?: string;
  rating?: number;
  totalRatings?: number;
}

export const ProductCardContent = memo(({ 
  title, 
  price, 
  description, 
  reason,
  className,
  rating,
  totalRatings
}: ProductCardContentProps) => {
  const { displayPrice } = transformPrice(price);
  
  return (
    <div className={cn("p-3 sm:p-4 space-y-2 flex-grow", className)}>
      {title && (
        <h3 className="font-semibold leading-none tracking-tight">
          {title}
        </h3>
      )}
      {displayPrice && (
        <p className="text-sm text-muted-foreground">
          {displayPrice}
        </p>
      )}
      {rating !== undefined && totalRatings !== undefined && (
        <ProductReview 
          rating={rating} 
          totalRatings={totalRatings} 
          className="mt-1"
        />
      )}
      {description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
      )}
      {reason && (
        <p className="text-xs text-muted-foreground italic">
          {reason}
        </p>
      )}
    </div>
  );
});

ProductCardContent.displayName = "ProductCardContent";