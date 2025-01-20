import { memo } from "react";
import { transformPrice } from "@/utils/priceUtils";
import { cn } from "@/lib/utils";

interface ProductCardContentProps {
  title: string;
  price?: string | number;
  description?: string;
  reason?: string;
  className?: string;
}

export const ProductCardContent = memo(({ 
  title, 
  price, 
  description, 
  reason,
  className 
}: ProductCardContentProps) => {
  const { displayPrice, numericValue } = transformPrice(price);
  
  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="font-semibold leading-none tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">
        {displayPrice}
      </p>
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