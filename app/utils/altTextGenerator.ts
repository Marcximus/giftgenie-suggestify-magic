import { GiftSuggestion } from '@/types/suggestions';

/**
 * Generates SEO-optimized alt text for product images
 * Format: "{Product Title} - {Price Range}, {Rating} stars"
 */
export const generateProductAltText = (product: GiftSuggestion): string => {
  const parts: string[] = [product.title];
  
  if (product.priceRange) {
    parts.push(`Price range: ${product.priceRange}`);
  }
  
  if (product.amazon_rating && product.amazon_total_ratings) {
    parts.push(`Rated ${product.amazon_rating} stars by ${product.amazon_total_ratings.toLocaleString()} customers`);
  } else if (product.amazon_rating) {
    parts.push(`Rated ${product.amazon_rating} stars`);
  }
  
  return parts.join(' - ');
};

/**
 * Generates descriptive alt text for blog post featured images
 */
export const generateBlogImageAltText = (title: string, category?: string): string => {
  const parts: string[] = [title];
  
  if (category) {
    parts.push(`${category} blog post`);
  } else {
    parts.push('blog post');
  }
  
  return parts.join(' - ');
};

/**
 * Generates alt text for fallback/search result images
 */
export const generateFallbackAltText = (searchTerm: string): string => {
  return `${searchTerm} gift idea image`;
};
