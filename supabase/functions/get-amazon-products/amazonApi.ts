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

function parsePrice(priceStr: string | null): number | undefined {
  if (!priceStr) return undefined;
  
  // Remove currency symbol and any commas
  const cleanPrice = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleanPrice);
  
  return isNaN(price) ? undefined : price;
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

  try {
    // First, search for products
    const searchResponse = await fetch(`https://${RAPIDAPI_HOST}/search?${searchParams.toString()}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    });

    if (!searchResponse.ok) {
      console.error('Amazon Search API error:', searchResponse.status, searchResponse.statusText);
      throw new AmazonApiError(
        `Amazon Search API error: ${searchResponse.status}`,
        searchResponse.status,
        searchResponse.headers.get('Retry-After') || undefined
      );
    }

    const searchData = await searchResponse.json();
    console.log('Search response:', searchData);

    if (!searchData.data?.products?.length) {
      throw new AmazonApiError('No products found');
    }

    const product = searchData.data.products[0];
    const asin = product.asin;

    if (!asin) {
      throw new AmazonApiError('Invalid product data: No ASIN found');
    }

    // Get detailed product information using ASIN
    const detailsResponse = await fetch(`https://${RAPIDAPI_HOST}/product-details?asin=${asin}&country=US`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    });

    if (detailsResponse.ok) {
      const detailsData = await detailsResponse.json();
      console.log('Product details response:', detailsData);

      if (detailsData.data) {
        const price = parsePrice(detailsData.data.product_price);
        const originalPrice = parsePrice(detailsData.data.product_original_price);

        return {
          title: detailsData.data.product_title || product.title,
          description: detailsData.data.product_description || product.product_description || product.title,
          price: price || originalPrice,
          currency: detailsData.data.currency || 'USD',
          imageUrl: detailsData.data.product_photos?.[0] || detailsData.data.product_photo || product.product_photo || product.thumbnail,
          rating: detailsData.data.product_star_rating ? parseFloat(detailsData.data.product_star_rating) : undefined,
          totalRatings: detailsData.data.product_num_ratings ? parseInt(detailsData.data.product_num_ratings, 10) : undefined,
          asin: asin,
        };
      }
    }

    // Fallback to search data if details request fails
    return {
      title: product.title,
      description: product.product_description || product.title,
      price: parsePrice(product.price?.current_price) || undefined,
      currency: product.price?.currency || 'USD',
      imageUrl: product.product_photo || product.thumbnail,
      rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
      totalRatings: product.product_num_ratings ? parseInt(product.product_num_ratings, 10) : undefined,
      asin: asin,
    };
  } catch (error) {
    console.error('Error searching Amazon:', error);
    if (error instanceof AmazonApiError) {
      throw error;
    }
    throw new AmazonApiError(error.message);
  }
}