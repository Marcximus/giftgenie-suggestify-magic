export const formatReviewData = (
  rating?: number | string | null,
  totalRatings?: number | string | null
) => {
  if (!rating) return null;

  const parsedRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  const parsedTotalRatings = totalRatings ? 
    (typeof totalRatings === 'string' ? parseInt(totalRatings.replace(/,/g, ''), 10) : totalRatings) : 
    undefined;

  if (isNaN(parsedRating)) return null;

  return {
    rating: parsedRating,
    totalRatings: parsedTotalRatings
  };
};