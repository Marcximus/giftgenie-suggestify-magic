const MINIMUM_RATING = 3.5;
const MINIMUM_REVIEWS = 10;

export const validateProductRating = (rating?: number, totalRatings?: number): boolean => {
  if (!rating || !totalRatings) {
    console.log('Missing rating data');
    return true; // Don't exclude products just because they're new
  }

  if (rating < MINIMUM_RATING) {
    console.log('Rating too low:', rating);
    return false;
  }

  if (totalRatings < MINIMUM_REVIEWS) {
    console.log('Not enough reviews:', totalRatings);
    return false;
  }

  return true;
};