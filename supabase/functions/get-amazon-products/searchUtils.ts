import { cleanSearchTerm } from './searchUtils';
import { parsePriceRange } from './priceUtils';

export const cleanSearchTerm = (searchTerm: string): string => {
  return searchTerm
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/&/g, 'and') // Replace & with 'and'
    .replace(/[^\w\s-]/g, ' ') // Remove special characters except hyphens
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

export const buildSearchUrl = (
  searchTerm: string,
  priceRange?: string
): URL => {
  const url = new URL('https://real-time-amazon-data.p.rapidapi.com/search');
  
  // Add required parameters
  url.searchParams.append('query', cleanSearchTerm(searchTerm));
  url.searchParams.append('country', 'US');
  url.searchParams.append('sort_by', 'RELEVANCE');
  url.searchParams.append('category_id', 'aps');
  
  // Add price constraints if provided
  if (priceRange) {
    const parsedRange = parsePriceRange(priceRange);
    if (parsedRange) {
      console.log('Adding price constraints to URL:', parsedRange);
      url.searchParams.append('min_price', Math.floor(parsedRange.min).toString());
      url.searchParams.append('max_price', Math.ceil(parsedRange.max).toString());
    }
  }
  
  // Add additional parameters for better results
  url.searchParams.append('product_condition', 'NEW');
  url.searchParams.append('is_prime', 'false');
  url.searchParams.append('deals_and_discounts', 'NONE');
  
  console.log('Built search URL:', url.toString());
  return url;
};