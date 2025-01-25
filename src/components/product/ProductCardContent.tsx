import { memo, useMemo } from 'react';
import { formatPrice } from '@/utils/priceUtils';

interface ProductCardContentProps {
  title: string;
  description: string;
  price: string;
  rating?: number;
  totalRatings?: number;
}

export const ProductCardContent = memo(({ 
  title, 
  description, 
  price,
  rating,
  totalRatings 
}: ProductCardContentProps) => {
  // Memoize price formatting
  const formattedPrice = useMemo(() => {
    console.log('Formatting price:', { price, type: typeof price, rawValue: price });
    return formatPrice(price);
  }, [price]);

  return (
    <div className="p-4 space-y-2">
      <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm sm:text-base">{formattedPrice}</span>
        {rating && (
          <div className="flex items-center space-x-1">
            <span className="text-sm">★ {rating.toFixed(1)}</span>
            {totalRatings && (
              <span className="text-xs text-muted-foreground">
                ({totalRatings.toLocaleString()})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

ProductCardContent.displayName = 'ProductCardContent';