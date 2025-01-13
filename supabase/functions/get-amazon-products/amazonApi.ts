import { RAPIDAPI_HOST } from '../_shared/config.ts';
import { calculateBackoffDelay } from './utils/backoffUtils.ts';

const MAX_RETRIES = 3;

export async function searchAmazonProduct(
  searchTerm: string,
  apiKey: string,
): Promise<any> {
  console.log('Searching Amazon for:', searchTerm);
  
  const searchParams = new URLSearchParams({
    query: searchTerm.trim(),
    country: 'US',
    category_id: 'aps',
    sort_by: 'RELEVANCE'
  });

  let product = null;
  let detailsData = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = calculateBackoffDelay(attempt);
        console.log(`Retry attempt ${attempt + 1}, waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // First try to get basic product info
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
        if (searchResponse.status === 429) {
          console.log('Search API rate limit hit, will retry after delay');
          continue; // Try again after delay
        }
        throw new Error(`Amazon Search API error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      console.log('Search response received');

      if (!searchData.data?.products?.[0]) {
        console.log('No products found');
        return null;
      }

      product = searchData.data.products[0];
      const asin = product.asin;

      if (!asin) {
        console.log('No ASIN found in product');
        return null;
      }

      // Wait a bit before making the details request
      await new Promise(resolve => setTimeout(resolve, 500));

      // Try to get detailed product information
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
        if (detailsResponse.status === 429) {
          console.log('Details API rate limit hit, using basic product info');
          // Don't retry, just use what we have from search
          break;
        }
        console.warn(`Failed to get product details: ${detailsResponse.status}`);
        break; // Use basic product info
      }

      detailsData = await detailsResponse.json();
      console.log('Details response received');
      break; // Success, exit retry loop

    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      if (attempt === MAX_RETRIES - 1) {
        throw error;
      }
    }
  }

  // If we have a product, return the best data we have
  if (product) {
    // Prefer details data if available, fall back to search data
    return {
      title: detailsData?.data?.product_title || product.title,
      description: detailsData?.data?.product_description || product.product_description || product.title,
      price: detailsData?.data?.price?.current_price || product.price?.current_price,
      currency: detailsData?.data?.price?.currency || product.price?.currency || 'USD',
      imageUrl: detailsData?.data?.product_photos?.[0] || product.product_photo || product.thumbnail,
      rating: detailsData?.data?.product_rating ? 
        parseFloat(detailsData.data.product_rating) : 
        product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
      totalRatings: detailsData?.data?.product_num_ratings ? 
        parseInt(detailsData.data.product_num_ratings, 10) : 
        product.product_num_ratings ? parseInt(product.product_num_ratings, 10) : undefined,
      asin: product.asin,
    };
  }

  return null;
}