import { corsHeaders } from '../_shared/cors';
import { RAPIDAPI_HOST } from './config';
import type { AmazonProduct } from './types';
import { extractPrice } from './priceUtils';
import { batchSearchProducts } from './batchProcessor';

const cleanSearchTerm = (searchTerm: string): string => {
  return searchTerm
    .replace(/\([^)]*\)/g, '')
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const simplifySearchTerm = (searchTerm: string): string => {
  return searchTerm
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(?:edition|version|series)\b/gi, '')
    .replace(/-.*$/, '')
    .replace(/\d+(?:\s*-\s*\d+)?\s*(?:gb|tb|inch|"|cm|mm)/gi, '')
    .trim();
};

export const getFallbackSearchTerms = (searchTerm: string): string[] => {
  const words = searchTerm.split(' ')
    .filter(word => !['with', 'and', 'in', 'for', 'by', 'the', 'a', 'an'].includes(word.toLowerCase()))
    .filter(word => word.length > 2);
  
  return words.length > 2 
    ? [words.slice(0, 3).join(' '), [words[0], words[words.length - 1]].join(' ')]
    : [words.join(' ')];
};

// Minimum quality thresholds
const MINIMUM_RATING = 3.5;
const MINIMUM_REVIEWS = 10;

// Blacklisted terms indicating irrelevant products
const BLACKLISTED_TERMS = [
  'cancel subscription',
  'guide',
  'manual',
  'how to',
  'instruction',
  'handbook',
  'tutorial'
];

const validateProduct = (product: any, priceRange?: { min: number; max: number }): boolean => {
  // Check for blacklisted terms in title
  const hasBlacklistedTerm = BLACKLISTED_TERMS.some(term => 
    product.title.toLowerCase().includes(term)
  );
  
  if (hasBlacklistedTerm) {
    console.log('Product filtered - contains blacklisted term:', product.title);
    return false;
  }

  // Validate rating if available
  if (product.product_star_rating) {
    const rating = parseFloat(product.product_star_rating);
    if (rating < MINIMUM_RATING) {
      console.log('Product filtered - low rating:', rating);
      return false;
    }
  }

  // Validate number of reviews if available
  if (product.product_num_ratings) {
    const reviews = parseInt(product.product_num_ratings);
    if (reviews < MINIMUM_REVIEWS) {
      console.log('Product filtered - insufficient reviews:', reviews);
      return false;
    }
  }

  // Validate price if range specified
  if (priceRange && product.product_price) {
    const price = extractPrice(product.product_price);
    if (!price || price < priceRange.min || price > priceRange.max) {
      console.log('Product filtered - price out of range:', price);
      return false;
    }
  }

  // Ensure product has required fields
  if (!product.asin || !product.title || !product.product_photo) {
    console.log('Product filtered - missing required fields');
    return false;
  }

  return true;
};

export const searchProducts = async (
  searchTerms: string[],
  apiKey: string
): Promise<AmazonProduct[]> => {
  if (!searchTerms.length) {
    console.error('No search terms provided');
    return [];
  }

  console.log('Starting optimized product search with terms:', searchTerms);
  const cleanedTerms = searchTerms.map(cleanSearchTerm);
  
  // Try with exact search terms first
  const { products, errors } = await batchSearchProducts(cleanedTerms, apiKey);
  
  // Only retry failed searches if we don't have enough results
  if (products.length < searchTerms.length) {
    const failedTerms = searchTerms.filter((_, index) => 
      !products.some(p => p.title.toLowerCase().includes(cleanedTerms[index].toLowerCase()))
    );
    
    if (failedTerms.length > 0) {
      console.log('Retrying failed terms with simplified search:', failedTerms);
      const simplifiedTerms = failedTerms.map(simplifySearchTerm);
      const { products: fallbackProducts } = await batchSearchProducts(simplifiedTerms, apiKey);
      return [...products, ...fallbackProducts];
    }
  }

  return products;
};

export const formatProduct = (product: any): AmazonProduct => {
  const price = extractPrice(product.product_price);
  
  return {
    title: product.title,
    description: product.product_description || product.title,
    price,
    currency: 'USD',
    imageUrl: product.product_photo || product.thumbnail,
    rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
    totalRatings: product.product_num_ratings ? parseInt(product.product_num_ratings.toString(), 10) : undefined,
    asin: product.asin
  };
};