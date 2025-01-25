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

export const searchProducts = async (
  searchTerms: string[],
  apiKey: string
): Promise<AmazonProduct[]> => {
  if (!searchTerms.length) {
    console.error('No search terms provided');
    return [];
  }

  console.log('Starting product search with terms:', searchTerms);
  const cleanedTerms = searchTerms.map(cleanSearchTerm);
  
  // Try with exact search terms first
  const { products, errors } = await batchSearchProducts(cleanedTerms, apiKey);
  if (products.length === searchTerms.length) {
    return products;
  }

  // For failed searches, try with simplified terms
  const failedTerms = searchTerms.filter((_, index) => 
    !products.some(p => p.title.toLowerCase().includes(cleanedTerms[index].toLowerCase()))
  );
  
  console.log('Retrying failed terms with simplified search:', failedTerms);
  const simplifiedTerms = failedTerms.map(simplifySearchTerm);
  const { products: fallbackProducts } = await batchSearchProducts(simplifiedTerms, apiKey);

  // Combine successful products with fallback results
  return [...products, ...fallbackProducts];
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