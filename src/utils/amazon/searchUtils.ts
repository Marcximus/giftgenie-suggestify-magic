import { cleanSearchTerm } from './utils';
import { getSearchTerms } from './categoryRouting';

export const searchWithFallback = async (
  searchTerm: string,
  apiKey: string,
  rapidApiHost: string
) => {
  console.log('Starting structured search for:', searchTerm);
  
  try {
    // Determine if this is a sports-related search
    const isSportsSearch = searchTerm.toLowerCase().includes('sports') ||
      ['basketball', 'football', 'soccer', 'tennis', 'fitness', 'running']
        .some(sport => searchTerm.toLowerCase().includes(sport));

    // Get prioritized search terms
    const searchTerms = isSportsSearch
      ? getSearchTerms(searchTerm, 'sports')
      : [searchTerm];

    // Try each search term in order of specificity
    for (const term of searchTerms) {
      console.log('Trying search term:', term);
      const searchData = await performSearch(term, apiKey, rapidApiHost);
      
      if (searchData?.data?.products?.length > 0) {
        // Validate result relevance
        const isRelevant = validateSearchResult(searchData.data.products[0], searchTerm);
        if (isRelevant) {
          console.log('Found relevant result for:', term);
          return searchData;
        }
      }
    }

    // If no relevant results found, try simplified search as last resort
    const simplifiedTerm = simplifySearchTerm(searchTerm);
    console.log('Trying simplified search term:', simplifiedTerm);
    return await performSearch(simplifiedTerm, apiKey, rapidApiHost);

  } catch (error) {
    console.error('Error in searchWithFallback:', error);
    throw error;
  }
};

const validateSearchResult = (product: any, searchTerm: string): boolean => {
  const searchWords = searchTerm.toLowerCase().split(' ')
    .filter(word => word.length > 3)
    .filter(word => !['with', 'and', 'for', 'the'].includes(word));

  const titleWords = product.title.toLowerCase().split(' ');
  
  // Check if at least 2 significant search terms appear in the title
  const matchingWords = searchWords.filter(word => titleWords.includes(word));
  return matchingWords.length >= 2;
};

const performSearch = async (
  term: string,
  apiKey: string,
  rapidApiHost: string
) => {
  const cleanedTerm = cleanSearchTerm(term);
  
  console.log('Performing search for:', cleanedTerm);

  const searchResponse = await fetch(
    `https://${rapidApiHost}/search?query=${encodeURIComponent(cleanedTerm)}&country=US`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': rapidApiHost,
      }
    }
  );

  if (!searchResponse.ok) {
    console.error('Search API error:', searchResponse.status);
    throw new Error(`Amazon Search API error: ${searchResponse.status}`);
  }

  return await searchResponse.json();
};

const simplifySearchTerm = (searchTerm: string): string => {
  return searchTerm
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(?:edition|version|series)\b/gi, '')
    .replace(/-.*$/, '')
    .replace(/\d+(?:\s*-\s*\d+)?\s*(?:gb|tb|inch|"|cm|mm)/gi, '')
    .trim();
};