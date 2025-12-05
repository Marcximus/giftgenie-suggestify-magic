import { ProductReviewProps } from "@/types/amazon";

export const ProductReview = ({ rating, totalRatings, className = "" }: ProductReviewProps) => {
  return (
    <div className={`flex items-center gap-2 text-sm text-gray-600 ${className}`}>
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="text-yellow-400">
            {i < Math.floor(rating) ? '★' : (i < rating ? '★' : '☆')}
          </span>
        ))}
        <span className="font-medium ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
      {totalRatings && (
        <span className="text-gray-500">
          ({totalRatings.toLocaleString()})
        </span>
      )}
    </div>
  );
};