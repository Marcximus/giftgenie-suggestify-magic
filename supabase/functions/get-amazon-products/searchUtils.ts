import { parsePriceRange } from './priceUtils';

export const buildSearchUrl = (
  searchTerm: string,
  priceRange?: string
): URL => {
  console.log('Building search URL with:', { searchTerm, priceRange });
  
  const url = new URL('https://real-time-amazon-data.p.rapidapi.com/search');
  
  // Add required parameters
  url.searchParams.append('query', cleanSearchTerm(searchTerm));
  url.searchParams.append('country', 'US');
  url.searchParams.append('sort_by', 'RELEVANCE');
  url.searchParams.append('category_id', 'aps');
  
  // Add price constraints if provided
  if (priceRange) {
    console.log('Processing price range:', priceRange);
    const parsedRange = parsePriceRange(priceRange);
    if (parsedRange) {
      // Ensure we have valid numbers and convert to fixed decimal places
      const minPrice = Number(parsedRange.min).toFixed(2);
      const maxPrice = Number(parsedRange.max).toFixed(2);
      
      console.log('Adding exact price constraints:', { minPrice, maxPrice });
      url.searchParams.append('min_price', minPrice);
      url.searchParams.append('max_price', maxPrice);
      
      // Verify parameters were added
      const finalParams = Object.fromEntries(url.searchParams.entries());
      console.log('Verified URL parameters:', finalParams);
    } else {
      console.warn('Failed to parse price range:', priceRange);
    }
  }
  
  const finalUrl = url.toString();
  console.log('Final Amazon API URL:', finalUrl);
  
  return url;
};

export const cleanSearchTerm = (searchTerm: string): string => {
  const cleaned = searchTerm
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/&/g, 'and') // Replace & with 'and'
    .replace(/[^\w\s-]/g, ' ') // Remove special characters except hyphens
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
  
  console.log('Cleaned search term:', { original: searchTerm, cleaned });
  return cleaned;
};