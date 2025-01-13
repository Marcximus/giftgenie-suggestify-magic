import { corsHeaders } from '../_shared/cors.ts';
import { RAPIDAPI_HOST } from '../_shared/config.ts';
import type { AmazonProduct } from '../_shared/types.ts';

export async function searchAmazonProduct(
  searchTerm: string,
  apiKey: string,
): Promise<AmazonProduct | null> {
  console.log('Searching Amazon for:', searchTerm);
  
  const searchParams = new URLSearchParams({
    query: searchTerm.trim(),
    country: 'US',
    category_id: 'aps',
    sort_by: 'RELEVANCE'
  });

  try {
    // First, search for the product
    const searchResponse = await fetch(
      `https://${RAPIDAPI_HOST}/search?${searchParams.toString()}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        }
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Amazon Search API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Search response received');

    if (!searchData.data?.products?.[0]) {
      console.log('No products found');
      return null;
    }

    const product = searchData.data.products[0];
    const asin = product.asin;

    if (!asin) {
      console.log('No ASIN found in product');
      return null;
    }

    // Then, get detailed product information
    const detailsResponse = await fetch(
      `https://${RAPIDAPI_HOST}/product-details?asin=${asin}&country=US`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        }
      }
    );

    if (!detailsResponse.ok) {
      console.warn(`Failed to get product details: ${detailsResponse.status}`);
      // Return basic product info if details request fails
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
    }

    const detailsData = await detailsResponse.json();
    console.log('Details response received');

    if (detailsData.data) {
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

    return null;

  } catch (error) {
    console.error('Error searching Amazon:', error);
    throw error;
  }
}