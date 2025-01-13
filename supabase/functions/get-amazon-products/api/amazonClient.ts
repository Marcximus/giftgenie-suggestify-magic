import { RAPIDAPI_HOST } from '../config.ts';
import { AmazonApiError } from '../types.ts';

export async function makeApiRequest(endpoint: string, params: URLSearchParams, apiKey: string) {
  const response = await fetch(`https://${RAPIDAPI_HOST}/${endpoint}?${params.toString()}`, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    }
  });

  if (!response.ok) {
    console.error(`Amazon API error: ${response.status} for endpoint ${endpoint}`);
    throw new AmazonApiError(`Amazon API error: ${response.status}`, response.status);
  }

  return response.json();
}

export function buildSearchParams(searchTerm: string, options: { 
  country?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  const searchParams = new URLSearchParams({
    query: searchTerm.trim(),
    country: options.country || 'US',
    category_id: options.category || 'aps',
    sort_by: 'RELEVANCE'
  });

  if (options.minPrice !== undefined) {
    searchParams.append('min_price', options.minPrice.toString());
  }
  if (options.maxPrice !== undefined) {
    searchParams.append('max_price', options.maxPrice.toString());
  }

  return searchParams;
}