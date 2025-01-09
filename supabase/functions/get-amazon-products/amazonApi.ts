import { RAPIDAPI_HOST, createRapidApiHeaders, RATE_LIMIT } from './config.ts';
import type { AmazonSearchResult, AmazonProductDetails, RateLimitInfo } from './types.ts';

export class AmazonApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public retryAfter?: string
  ) {
    super(message);
    this.name = 'AmazonApiError';
  }
}

// Simple in-memory rate limiting
const requestLog: RateLimitInfo[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  // Clean up old requests
  const windowStart = now - RATE_LIMIT.WINDOW_MS;
  const recentRequests = requestLog.filter(req => req.timestamp > windowStart);
  requestLog.length = 0;
  requestLog.push(...recentRequests);
  
  return requestLog.length >= RATE_LIMIT.MAX_REQUESTS;
}

function logRequest() {
  requestLog.push({ timestamp: Date.now(), count: 1 });
}

interface SearchOptions {
  min?: number;
  max?: number;
  sortBy?: 'LOWEST_PRICE' | 'HIGHEST_PRICE' | 'RELEVANCE';
}

export async function searchProduct(
  searchTerm: string, 
  apiKey: string,
  options: SearchOptions = {}
): Promise<string> {
  if (isRateLimited()) {
    throw new AmazonApiError(
      'Rate limit exceeded',
      429,
      RATE_LIMIT.RETRY_AFTER.toString()
    );
  }

  console.log('Searching Amazon for:', searchTerm, 'with options:', options);
  
  // Build search URL with price constraints
  const searchParams = new URLSearchParams({
    query: searchTerm,
    country: 'US',
    sort_by: options.sortBy || 'RELEVANCE'
  });

  if (options.min !== undefined) {
    searchParams.append('min_price', options.min.toString());
  }
  if (options.max !== undefined) {
    searchParams.append('max_price', options.max.toString());
  }
  
  const searchUrl = `https://${RAPIDAPI_HOST}/search?${searchParams.toString()}`;
  
  try {
    logRequest();
    const response = await fetch(searchUrl, {
      headers: createRapidApiHeaders(apiKey),
    });

    if (!response.ok) {
      console.error('Amazon search failed with status:', response.status);
      const responseText = await response.text();
      console.error('Response:', responseText);
      
      if (response.status === 429) {
        throw new AmazonApiError(
          'Rate limit exceeded',
          response.status,
          response.headers.get('Retry-After') || '30'
        );
      }
      
      if (response.status === 403) {
        throw new AmazonApiError('Invalid API key', response.status);
      }
      
      throw new AmazonApiError(`Amazon search failed: ${response.status}`, response.status);
    }

    const searchData = await response.json() as AmazonSearchResult;
    console.log('Search results:', JSON.stringify(searchData, null, 2));

    const firstProduct = searchData.data?.products?.[0];
    if (!firstProduct?.asin) {
      throw new AmazonApiError('No products found');
    }

    return firstProduct.asin;
  } catch (error) {
    if (error instanceof AmazonApiError) {
      throw error;
    }
    throw new AmazonApiError(`Failed to search Amazon: ${error.message}`);
  }
}

export async function getProductDetails(asin: string, apiKey: string): Promise<AmazonProductDetails> {
  if (isRateLimited()) {
    throw new AmazonApiError(
      'Rate limit exceeded',
      429,
      RATE_LIMIT.RETRY_AFTER.toString()
    );
  }

  console.log('Fetching details for ASIN:', asin);
  
  try {
    logRequest();
    const detailsUrl = `https://${RAPIDAPI_HOST}/product-details?asin=${asin}&country=US`;
    const response = await fetch(detailsUrl, {
      headers: createRapidApiHeaders(apiKey),
    });

    if (!response.ok) {
      console.error('Product details failed with status:', response.status);
      const responseText = await response.text();
      console.error('Response:', responseText);
      
      if (response.status === 429) {
        throw new AmazonApiError(
          'Rate limit exceeded',
          response.status,
          response.headers.get('Retry-After') || '30'
        );
      }
      
      throw new AmazonApiError(`Product details failed: ${response.status}`, response.status);
    }

    const detailsData = await response.json() as AmazonProductDetails;
    console.log('Product details received:', JSON.stringify(detailsData, null, 2));
    
    return detailsData;
  } catch (error) {
    if (error instanceof AmazonApiError) {
      throw error;
    }
    throw new AmazonApiError(`Failed to get product details: ${error.message}`);
  }
}