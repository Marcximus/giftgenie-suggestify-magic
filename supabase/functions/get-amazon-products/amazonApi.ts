import { RAPIDAPI_HOST } from '../_shared/config.ts';
import { AmazonProduct } from './types.ts';
import { cleanSearchTerm, simplifySearchTerm } from './utils/textUtils.ts';
import { isLikelyAccessory } from './utils/productUtils.ts';
import { calculateBackoffDelay } from './utils/backoffUtils.ts';

export async function searchAmazonProduct(
  searchTerm: string,
  apiKey: string,
): Promise<AmazonProduct | null> {
  console.log('Searching Amazon for:', searchTerm);
  
  // Try different search term variations
  const searchTerms = [
    searchTerm,
    cleanSearchTerm(searchTerm),
    simplifySearchTerm(searchTerm)
  ];

  for (const term of searchTerms) {
    try {
      const searchParams = new URLSearchParams({
        query: term.trim(),
        country: 'US',
        category_id: 'aps',
        sort_by: 'RELEVANCE'
      });

      console.log('Attempting search with params:', searchParams.toString());

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
          const retryAfter = searchResponse.headers.get('Retry-After') || '30';
          throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
        }
        console.warn(`Search failed for term "${term}":`, searchResponse.status);
        continue; // Try next search term
      }

      const searchData = await searchResponse.json();
      console.log('Search response received for term:', term);

      if (!searchData.data?.products?.length) {
        console.log('No products found for term:', term);
        continue; // Try next search term
      }

      // Find first valid product (not an accessory)
      const product = searchData.data.products.find(p => 
        p.asin && !isLikelyAccessory(p.title)
      );

      if (!product) {
        console.log('No valid products found for term:', term);
        continue; // Try next search term
      }

      // Add delay before details request
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get detailed product information
      const detailsResponse = await fetch(
        `https://${RAPIDAPI_HOST}/product-details?asin=${product.asin}&country=US`,
        {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': RAPIDAPI_HOST,
          }
        }
      );

      // If details request succeeds, use that data
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        console.log('Details found for product:', product.asin);

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

      // Fallback to basic product info if details request fails
      console.log('Using basic product info for:', product.asin);
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
      console.error('Error searching with term:', term, error);
      if (error.message?.includes('Rate limit exceeded')) {
        throw error; // Propagate rate limit errors
      }
      // Continue to next search term for other errors
    }
  }

  console.log('No products found after trying all search terms');
  return null;
}