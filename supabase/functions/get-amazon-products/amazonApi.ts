import { RAPIDAPI_HOST, createRapidApiHeaders } from './config.ts';
import type { AmazonSearchResult, AmazonProductDetails } from './types.ts';

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

export async function searchProduct(searchTerm: string, apiKey: string): Promise<string> {
  console.log('Searching Amazon for:', searchTerm);
  
  const searchUrl = `https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(searchTerm)}&country=US`;
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
}

export async function getProductDetails(asin: string, apiKey: string): Promise<AmazonProductDetails> {
  console.log('Fetching details for ASIN:', asin);
  
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
}