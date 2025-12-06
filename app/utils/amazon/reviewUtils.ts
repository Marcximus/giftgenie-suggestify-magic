import { AmazonReview } from "@/types/amazon";

export const formatReviewData = (
  rating?: number | string | null,
  totalRatings?: number | string | null
): AmazonReview | null => {
  if (!rating) return null;

  const parsedRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  const parsedTotalRatings = totalRatings ? 
    (typeof totalRatings === 'string' ? parseInt(totalRatings, 10) : totalRatings) : 
    undefined;

  if (isNaN(parsedRating)) return null;

  return {
    rating: parsedRating,
    totalRatings: parsedTotalRatings
  };
};