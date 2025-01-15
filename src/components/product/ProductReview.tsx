import { ProductReviewProps } from "@/types/amazon";

export const ProductReview = ({ rating, totalRatings, className = "" }: ProductReviewProps) => {
  // Convert rating to a number and handle potential undefined values
  const numericRating = typeof rating === 'string' ? parseFloat(rating) : rating || 0;
  const formattedRating = numericRating.toFixed(1);
  
  // Format total ratings with commas
  const formattedTotalRatings = totalRatings?.toLocaleString() || '0';

  return (
    <div className={`flex flex-col items-center gap-2 my-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm ${className}`}>
      <div className="flex items-center gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="text-yellow-400 text-xl">
            {i < Math.floor(numericRating) ? '★' : (i < numericRating ? '★' : '☆')}
          </span>
        ))}
        <span className="font-semibold text-xl text-gray-800">
          {formattedRating}
        </span>
      </div>
      {totalRatings > 0 && (
        <div className="text-base text-gray-600">
          Based on {formattedTotalRatings} verified customer reviews
        </div>
      )}
    </div>
  );
};