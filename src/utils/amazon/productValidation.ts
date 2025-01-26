import { AmazonProduct } from '@/types/amazon';

// Minimum requirements for product quality
const MINIMUM_RATING = 3.5;
const MINIMUM_REVIEWS = 10;
const MINIMUM_TITLE_LENGTH = 10;
const MAXIMUM_TITLE_LENGTH = 200;

// Blacklisted terms that indicate irrelevant products
const BLACKLISTED_TERMS = [
  'cancel subscription',
  'guide',
  'manual',
  'how to',
  'instruction',
  'handbook',
  'tutorial',
  'replacement',
  'repair',
  'warranty',
  'refund',
  'return',
  'policy'
];

// Categories that are typically not gift-appropriate
const EXCLUDED_CATEGORIES = [
  'Software',
  'Digital Services',
  'Gift Cards',
  'Subscriptions',
  'Industrial Supplies',
  'Business Products'
];

export const validateProductTitle = (title: string): boolean => {
  if (!title || 
      title.length < MINIMUM_TITLE_LENGTH || 
      title.length > MAXIMUM_TITLE_LENGTH) {
    console.log('Title length validation failed:', title);
    return false;
  }

  const lowerTitle = title.toLowerCase();
  const hasBlacklistedTerm = BLACKLISTED_TERMS.some(term => 
    lowerTitle.includes(term.toLowerCase())
  );

  if (hasBlacklistedTerm) {
    console.log('Title contains blacklisted term:', title);
    return false;
  }

  const hasExcludedCategory = EXCLUDED_CATEGORIES.some(category =>
    lowerTitle.includes(category.toLowerCase())
  );

  if (hasExcludedCategory) {
    console.log('Product belongs to excluded category:', title);
    return false;
  }

  return true;
};

export const validateProductRating = (
  rating?: number,
  totalRatings?: number
): boolean => {
  if (!rating || !totalRatings) {
    console.log('Missing rating information');
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

export const validateProductPrice = (
  price?: number,
  minPrice?: number,
  maxPrice?: number
): boolean => {
  if (!price) {
    console.log('Missing price information');
    return false;
  }

  if (price <= 0) {
    console.log('Invalid price:', price);
    return false;
  }

  if (minPrice && price < minPrice) {
    console.log('Price below minimum:', price, 'min:', minPrice);
    return false;
  }

  if (maxPrice && price > maxPrice) {
    console.log('Price above maximum:', price, 'max:', maxPrice);
    return false;
  }

  return true;
};

export const validateProduct = (
  product: AmazonProduct,
  minPrice?: number,
  maxPrice?: number
): boolean => {
  console.log('Validating product:', {
    title: product.title,
    price: product.price,
    rating: product.rating,
    totalRatings: product.totalRatings
  });

  if (!validateProductTitle(product.title)) {
    return false;
  }

  if (!validateProductRating(product.rating, product.totalRatings)) {
    return false;
  }

  if (!validateProductPrice(product.price, minPrice, maxPrice)) {
    return false;
  }

  if (!product.imageUrl) {
    console.log('Missing product image');
    return false;
  }

  if (!product.asin) {
    console.log('Missing ASIN');
    return false;
  }

  console.log('Product passed all validation checks');
  return true;
};