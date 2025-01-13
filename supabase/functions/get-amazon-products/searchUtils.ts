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

export const getFallbackSearchTerms = (searchTerm: string, ageCategory?: string): string[] => {
  const words = searchTerm.split(' ')
    .filter(word => !['with', 'and', 'in', 'for', 'by', 'the', 'a', 'an'].includes(word.toLowerCase()))
    .filter(word => word.length > 2);
  
  const searchTerms = [];
  
  // Add age-appropriate qualifiers based on category
  const ageQualifier = ageCategory === 'teen' ? 'teen ' : 
                      ageCategory === 'child' ? 'kids ' :
                      ageCategory === 'infant' ? 'baby ' : '';
  
  // Try with first six words
  if (words.length > 6) {
    searchTerms.push(ageQualifier + words.slice(0, 6).join(' '));
  }
  
  // Try with first three words
  if (words.length > 3) {
    searchTerms.push(ageQualifier + words.slice(0, 3).join(' '));
  }
  
  // Try with just the first word but maintain age context
  if (words.length > 0) {
    searchTerms.push(ageQualifier + words[0]);
  }
  
  return searchTerms;
};

export const performSearch = async (
  term: string,
  apiKey: string,
  rapidApiHost: string,
  ageCategory?: string
) => {
  const cleanedTerm = cleanSearchTerm(term);
  console.log('Searching with cleaned term:', cleanedTerm, 'Age category:', ageCategory);

  // Add age-specific category to search
  const categoryId = ageCategory === 'teen' ? 'teen-gaming' : 
                    ageCategory === 'child' ? 'toys-games' :
                    ageCategory === 'infant' ? 'baby-products' : 'aps';

  const searchParams = new URLSearchParams({
    query: cleanedTerm,
    country: 'US',
    category_id: categoryId,
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

  const searchData = await searchResponse.json();
  console.log('Search response data:', {
    title: searchData.data?.products?.[0]?.title,
    price: searchData.data?.products?.[0]?.price,
    totalResults: searchData.data?.products?.length || 0,
    ageCategory,
    categoryId
  });
  return searchData;
};