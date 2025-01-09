import { RAPIDAPI_HOST } from './config.ts';
import type { AmazonProduct } from './types.ts';

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

export async function searchAmazonProduct(
  searchTerm: string,
  apiKey: string,
  minPrice?: number,
  maxPrice?: number
): Promise<AmazonProduct> {
  if (!apiKey) {
    throw new AmazonApiError('RapidAPI key not configured', 403);
  }

  console.log('Searching Amazon for:', searchTerm, { minPrice, maxPrice });
  
  const searchParams = new URLSearchParams({
    query: encodeURIComponent(searchTerm.trim()),
    country: 'US',
    category_id: 'aps',
    sort_by: 'RELEVANCE'
  });

  if (minPrice !== undefined) {
    searchParams.append('min_price', minPrice.toString());
  }
  if (maxPrice !== undefined) {
    searchParams.append('max_price', maxPrice.toString());
  }

  const url = `https://${RAPIDAPI_HOST}/search?${searchParams.toString()}`;
  
  try {
    console.log('Making request to:', url);
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    });

    if (!response.ok) {
      console.error('Amazon API error:', response.status, response.statusText);
      const retryAfter = response.headers.get('Retry-After');
      throw new AmazonApiError(
        `Amazon API error: ${response.status}`,
        response.status,
        retryAfter || undefined
      );
    }

    const data = await response.json();
    console.log('Search response:', data);

    if (!data.data?.products?.length) {
      throw new AmazonApiError('No products found');
    }

    const product = data.data.products[0];

    // Get detailed product information
    const detailsResponse = await fetch(`https://${RAPIDAPI_HOST}/product-details?asin=${product.asin}&country=US`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    });

    if (detailsResponse.ok) {
      const detailsData = await detailsResponse.json();
      console.log('Details response:', detailsData);

      if (detailsData.data) {
        return {
          title: detailsData.data.product_title || product.title,
          description: detailsData.data.product_description || product.product_description || product.title,
          price: detailsData.data.price?.current_price || product.price?.current_price,
          currency: detailsData.data.price?.currency || product.price?.currency || 'USD',
          imageUrl: detailsData.data.product_photos?.[0] || product.product_photo || product.thumbnail,
          rating: detailsData.data.product_rating ? parseFloat(detailsData.data.product_rating) : undefined,
          totalRatings: detailsData.data.product_num_ratings ? parseInt(detailsData.data.product_num_ratings, 10) : undefined,
          asin: product.asin,
        };
      }
    }

    // Fallback to search data if details request fails
    return {
      title: product.title,
      description: product.product_description || product.title,
      price: product.price?.current_price,
      currency: product.price?.currency || 'USD',
      imageUrl: product.product_photo || product.thumbnail,
      rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
      totalRatings: product.product_num_ratings ? parseInt(product.product_num_ratings, 10) : undefined,
      asin: product.asin,
    };
  } catch (error) {
    console.error('Error searching Amazon:', error);
    if (error instanceof AmazonApiError) {
      throw error;
    }
    throw new AmazonApiError(error.message);
  }
}