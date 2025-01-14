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
  
  const url = new URL(`https://${RAPIDAPI_HOST}/search`);
  // Don't encode searchTerm - URL API will handle it
  url.searchParams.append('query', searchTerm.trim());
  url.searchParams.append('country', 'US');
  url.searchParams.append('category_id', 'aps');
  url.searchParams.append('sort_by', 'RELEVANCE');

  if (minPrice !== undefined) {
    url.searchParams.append('min_price', minPrice.toString());
  }
  if (maxPrice !== undefined) {
    url.searchParams.append('max_price', maxPrice.toString());
  }

  try {
    console.log('Making request to:', url.toString());
    
    // First, search for the product
    const searchResponse = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    });

    if (!searchResponse.ok) {
      console.error('Amazon Search API error:', searchResponse.status);
      throw new AmazonApiError(`Amazon API error: ${searchResponse.status}`, searchResponse.status);
    }

    const searchData = await searchResponse.json();
    console.log('Search response:', searchData);

    if (!searchData.data?.products?.[0]) {
      throw new AmazonApiError('No products found');
    }

    const product = searchData.data.products[0];
    
    // Ensure we have an ASIN
    if (!product.asin) {
      // If no ASIN found in first result, try next products
      const productWithAsin = searchData.data.products.find(p => p.asin);
      if (!productWithAsin) {
        throw new AmazonApiError('No product with ASIN found');
      }
      product = productWithAsin;
    }

    const asin = product.asin;

    // Then, get detailed product information using the ASIN
    const detailsUrl = new URL(`https://${RAPIDAPI_HOST}/product-details`);
    detailsUrl.searchParams.append('asin', asin);
    detailsUrl.searchParams.append('country', 'US');

    const detailsResponse = await fetch(detailsUrl.toString(), {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    });

    if (detailsResponse.ok) {
      const detailsData = await detailsResponse.json();
      console.log('Details response:', detailsData);

      if (detailsData.data) {
        // Combine search and details data, preferring details when available
        return {
          title: detailsData.data.product_title || product.title,
          description: detailsData.data.product_description || product.product_description || product.title,
          price: detailsData.data.price?.current_price || product.price?.current_price,
          currency: detailsData.data.price?.currency || product.price?.currency || 'USD',
          imageUrl: detailsData.data.product_photos?.[0] || product.product_photo || product.thumbnail,
          rating: detailsData.data.product_rating ? parseFloat(detailsData.data.product_rating) : undefined,
          totalRatings: detailsData.data.product_num_ratings ? parseInt(detailsData.data.product_num_ratings, 10) : undefined,
          asin: asin,
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
      asin: asin,
    };
  } catch (error) {
    console.error('Error searching Amazon:', error);
    throw error instanceof AmazonApiError ? error : new AmazonApiError(error.message);
  }
}