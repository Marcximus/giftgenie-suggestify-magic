import { AmazonProduct } from './types.ts';
import { isRateLimited, logRequest } from './rate-limiter.ts';

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

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

export async function searchAmazonProduct(keyword: string): Promise<AmazonProduct> {
  if (!RAPIDAPI_KEY) {
    throw new AmazonApiError('RapidAPI key not configured', 403);
  }

  if (isRateLimited()) {
    throw new AmazonApiError('Rate limit exceeded', 429, '30');
  }

  console.log('Searching Amazon for:', keyword);
  const url = `https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(keyword)}&country=US`;
  
  try {
    logRequest();
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST
      }
    });

    if (!response.ok) {
      console.error('Amazon API error:', response.status);
      if (response.status === 429) {
        throw new AmazonApiError('Rate limit exceeded', 429, response.headers.get('Retry-After') || '30');
      }
      if (response.status === 403) {
        throw new AmazonApiError('Invalid API key', 403);
      }
      throw new AmazonApiError(`Amazon API error: ${response.status}`, response.status);
    }

    const data = await response.json();
    console.log('Amazon API response:', JSON.stringify(data, null, 2));

    if (data.status === 'ERROR') {
      throw new AmazonApiError(data.error.message);
    }

    const product = data.data?.products?.[0];
    if (!product) {
      throw new AmazonApiError('No products found');
    }

    return product;
  } catch (error) {
    if (error instanceof AmazonApiError) {
      throw error;
    }
    throw new AmazonApiError(`Failed to search Amazon: ${error.message}`);
  }
}