import { AmazonProduct } from '@/types/amazon';
import { validateProductTitle } from './validation/titleValidation';
import { validateProductRating } from './validation/ratingValidation';
import { validateProductPrice } from './validation/priceValidation';

export const validateProduct = (product: AmazonProduct): boolean => {
  // Validate title
  if (!validateProductTitle(product.title)) {
    return false;
  }

  // Validate rating and reviews
  if (!validateProductRating(product.rating, product.totalRatings)) {
    return false;
  }

  // Validate price
  if (!validateProductPrice(product.price)) {
    return false;
  }

  return true;
};

// Re-export individual validation functions for direct use
export { validateProductTitle } from './validation/titleValidation';
export { validateProductRating } from './validation/ratingValidation';
export { validateProductPrice } from './validation/priceValidation';