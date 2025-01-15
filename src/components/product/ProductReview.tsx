import { ProductReviewProps } from "@/types/amazon";

export const ProductReview = ({ rating, totalRatings, className = "" }: ProductReviewProps) => {
  return (
    <div className={`flex flex-col items-center gap-2 my-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm ${className}`}>
      <div className="flex items-center gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="text-yellow-400 text-xl">
            {i < Math.floor(rating) ? '★' : (i < rating ? '★' : '☆')}
          </span>
        ))}
        <span className="font-semibold text-xl text-gray-800">
          {rating.toFixed(1)}
        </span>
      </div>
      {totalRatings && (
        <div className="text-base text-gray-600">
          Based on {totalRatings.toLocaleString()} verified customer reviews
        </div>
      )}
    </div>
  );
};