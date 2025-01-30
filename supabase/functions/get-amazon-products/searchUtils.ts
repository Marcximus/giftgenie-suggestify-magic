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
  url.searchParams.append('page', '1');
  url.searchParams.append('results_per_page', '20');
  
  // Add price constraints if provided
  if (priceRange) {
    console.log('Processing price range:', priceRange);
    const parsedRange = parsePriceRange(priceRange);
    if (parsedRange) {
      // Convert to cents for the API
      const minPriceCents = Math.floor(parsedRange.min * 100);
      const maxPriceCents = Math.ceil(parsedRange.max * 100);
      
      console.log('Adding price constraints:', { minPriceCents, maxPriceCents });
      url.searchParams.append('min_price', minPriceCents.toString());
      url.searchParams.append('max_price', maxPriceCents.toString());
      
      // Verify parameters were added
      const finalParams = Object.fromEntries(url.searchParams.entries());
      console.log('Final URL parameters:', finalParams);
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