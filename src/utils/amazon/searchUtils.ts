import { AmazonProduct } from './types';

const cleanSearchTerm = (searchTerm: string): string => {
  return searchTerm
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/&/g, 'and') // Replace & with 'and'
    .replace(/[^\w\s-]/g, ' ') // Remove special characters except hyphens
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

export const simplifySearchTerm = (searchTerm: string): string => {
  // Remove specific model numbers, sizes, and colors from search term
  const genericSearchTerm = searchTerm
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/\b(?:edition|version|series)\b/gi, '') // Remove common suffixes
    .replace(/-.*$/, '') // Remove anything after a hyphen
    .replace(/\d+(?:\s*-\s*\d+)?\s*(?:gb|tb|inch|"|cm|mm)/gi, '') // Remove sizes
    .trim();

  return genericSearchTerm;
};

export const getFallbackSearchTerms = (searchTerm: string): string[] => {
  const words = searchTerm.split(' ')
    .filter(word => !['with', 'and', 'in', 'for', 'by', 'the', 'a', 'an'].includes(word.toLowerCase()))
    .filter(word => word.length > 2);
  
  const searchTerms = [];
  
  if (words.length > 2) {
    searchTerms.push(words.slice(0, 3).join(' '));
    searchTerms.push([words[0], words[words.length - 1]].join(' '));
  } else {
    searchTerms.push(words.join(' '));
  }
  
  return [...new Set(searchTerms)];
};

export const performSearch = async (
  term: string,
  apiKey: string,
  rapidApiHost: string
): Promise<{ data?: { products?: any[] } }> => {
  const cleanedTerm = cleanSearchTerm(term);
  console.log('Searching with term:', cleanedTerm);

  const searchParams = new URLSearchParams({
    query: cleanedTerm,
    country: 'US',
    category_id: 'aps',
    sort_by: 'RELEVANCE'
  });

  const searchResponse = await fetch(
    `https://${rapidApiHost}/search?${searchParams.toString()}`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': rapidApiHost,
      }
    }
  );

  if (!searchResponse.ok) {
    if (searchResponse.status === 429) {
      throw new Error('rate limit exceeded');
    }
    throw new Error(`Amazon Search API error: ${searchResponse.status}`);
  }

  return searchResponse.json();
};

export const searchWithFallback = async (
  searchTerm: string,
  priceRange: string
): Promise<AmazonProduct | null> => {
  try {
    // Try with exact search term first
    const result = await performSearch(
      searchTerm,
      process.env.RAPIDAPI_KEY || '',
      'real-time-amazon-data.p.rapidapi.com'
    );

    if (result.data?.products?.[0]) {
      const product = result.data.products[0];
      return {
        title: product.title || searchTerm,
        description: product.product_description || product.title || '',
        price: parseFloat(product.product_price?.replace(/[$,]/g, '') || '0'),
        currency: 'USD',
        imageUrl: product.product_photo || product.thumbnail,
        rating: parseFloat(product.product_star_rating || '0'),
        totalRatings: parseInt(product.product_num_ratings || '0', 10),
        asin: product.asin || ''
      };
    }

    // Try with simplified search term
    const simplifiedTerm = simplifySearchTerm(searchTerm);
    const fallbackResult = await performSearch(
      simplifiedTerm,
      process.env.RAPIDAPI_KEY || '',
      'real-time-amazon-data.p.rapidapi.com'
    );

    if (fallbackResult.data?.products?.[0]) {
      const product = fallbackResult.data.products[0];
      return {
        title: product.title || searchTerm,
        description: product.product_description || product.title || '',
        price: parseFloat(product.product_price?.replace(/[$,]/g, '') || '0'),
        currency: 'USD',
        imageUrl: product.product_photo || product.thumbnail,
        rating: parseFloat(product.product_star_rating || '0'),
        totalRatings: parseInt(product.product_num_ratings || '0', 10),
        asin: product.asin || ''
      };
    }

    return null;
  } catch (error) {
    console.error('Error in searchWithFallback:', error);
    throw error;
  }
};