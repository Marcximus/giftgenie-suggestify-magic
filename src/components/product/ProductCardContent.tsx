import { ProductReview } from "./ProductReview";

interface ProductCardContentProps {
  description: string;
  price: string;
  rating?: number;
  totalRatings?: number;
  showTitle?: boolean;
}

export const ProductCardContent = ({ 
  description, 
  price, 
  rating, 
  totalRatings,
  showTitle = true 
}: ProductCardContentProps) => {
  return (
    <div className="flex-grow p-3 sm:p-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
        <p className="text-sm font-medium">
          USD {price}
        </p>
        {rating && (
          <ProductReview 
            rating={rating} 
            totalRatings={totalRatings} 
            className="mt-1"
          />
        )}
      </div>
    </div>
  );
};