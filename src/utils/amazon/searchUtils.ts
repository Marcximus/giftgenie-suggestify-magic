import { cleanSearchTerm } from './utils';

export const searchWithFallback = async (
  searchTerm: string,
  apiKey: string,
  rapidApiHost: string
) => {
  console.log('Starting search with fallback for:', searchTerm);
  
  try {
    // First try with exact search term
    const searchData = await performSearch(searchTerm, apiKey, rapidApiHost);
    
    if (searchData?.data?.products?.length > 0) {
      return searchData;
    }

    // If no results, try with simplified search term
    const simplifiedTerm = simplifySearchTerm(searchTerm);
    console.log('Trying simplified search term:', simplifiedTerm);
    
    const fallbackData = await performSearch(simplifiedTerm, apiKey, rapidApiHost);
    
    if (fallbackData?.data?.products?.length > 0) {
      return fallbackData;
    }

    // If still no results, try with fallback terms
    const fallbackTerms = getFallbackSearchTerms(searchTerm);
    
    for (const term of fallbackTerms) {
      console.log('Trying fallback term:', term);
      const termData = await performSearch(term, apiKey, rapidApiHost);
      
      if (termData?.data?.products?.length > 0) {
        return termData;
      }
    }

    return null;
  } catch (error) {
    console.error('Error in searchWithFallback:', error);
    throw error;
  }
};

const performSearch = async (
  term: string,
  apiKey: string,
  rapidApiHost: string
) => {
  const cleanedTerm = cleanSearchTerm(term);
  console.log('Performing search for:', cleanedTerm);

  const url = new URL(`https://${rapidApiHost}/search`);
  url.searchParams.append('query', encodeURIComponent(cleanedTerm));
  url.searchParams.append('country', 'US');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': rapidApiHost,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    console.error('Search API error:', response.status);
    throw new Error(`Amazon Search API error: ${response.status}`);
  }

  return await response.json();
};

const simplifySearchTerm = (searchTerm: string): string => {
  return searchTerm
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(?:edition|version|series)\b/gi, '')
    .replace(/-.*$/, '')
    .replace(/\d+(?:\s*-\s*\d+)?\s*(?:gb|tb|inch|"|cm|mm)/gi, '')
    .trim();
};

const getFallbackSearchTerms = (searchTerm: string): string[] => {
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