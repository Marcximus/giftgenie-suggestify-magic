import { corsHeaders } from '../config.ts';

export const makeApiRequest = async (endpoint: string, params: URLSearchParams, apiKey: string) => {
  const RAPIDAPI_HOST = 'amazon23.p.rapidapi.com';
  
  const response = await fetch(
    `https://${RAPIDAPI_HOST}/${endpoint}?${params.toString()}`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Amazon API error: ${response.status}`);
  }

  return await response.json();
};

export const buildSearchParams = (searchTerm: string, options: { minPrice?: number; maxPrice?: number } = {}) => {
  const params = new URLSearchParams({
    query: searchTerm.trim(),
    country: 'US',
    category_id: 'aps',
    sort_by: 'RELEVANCE'
  });

  if (options.minPrice !== undefined) {
    params.append('min_price', options.minPrice.toString());
  }
  if (options.maxPrice !== undefined) {
    params.append('max_price', options.maxPrice.toString());
  }

  return params;
};