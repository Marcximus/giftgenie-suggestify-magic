import { performSearch, simplifySearchTerm, getFallbackSearchTerms } from './searchUtils';
import { getProductDetails } from './productDetails';
import { getPriceFromMultipleSources } from './priceUtils';
import { AmazonProduct } from './types';

const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

export async function searchAmazonProduct(searchTerm: string, apiKey: string): Promise<AmazonProduct | null> {
  console.log('Initial search attempt for:', searchTerm);

  try {
    // Get generic search term
    const genericSearchTerm = simplifySearchTerm(searchTerm);
    console.log('Attempting search with generic term:', genericSearchTerm);
    
    // First attempt with generic search term
    let searchData = await performSearch(genericSearchTerm, apiKey, RAPIDAPI_HOST);
    
    // If no products found, try with fallback search terms
    if (!searchData.data?.products?.length) {
      const fallbackTerms = getFallbackSearchTerms(genericSearchTerm);
      
      for (const term of fallbackTerms) {
        console.log('Attempting fallback search with:', term);
        searchData = await performSearch(term, apiKey, RAPIDAPI_HOST);
        if (searchData.data?.products?.length) break;
      }
    }

    // If still no products found, return null
    if (!searchData.data?.products?.length) {
      console.log('No products found with any search attempt');
      return null;
    }

    const product = searchData.data.products[0];
    const asin = product.asin;

    if (!asin) {
      console.warn('Invalid product data: No ASIN found');
      return null;
    }

    // Get detailed product information
    const detailsData = await getProductDetails(asin, apiKey, RAPIDAPI_HOST);

    if (detailsData?.data) {
      const price = getPriceFromMultipleSources(
        detailsData.data.product_price,
        detailsData.data.product_original_price,
        product.price?.current_price
      );

      if (!price) {
        console.warn('No valid price found for product:', {
          asin,
          title: detailsData.data.product_title,
          priceAttempts: {
            productPrice: detailsData.data.product_price,
            originalPrice: detailsData.data.product_original_price,
            searchPrice: product.price?.current_price
          }
        });
      }

      return {
        title: detailsData.data.product_title || product.title,
        description: detailsData.data.product_description || product.product_description || product.title,
        price,
        currency: detailsData.data.currency || 'USD',
        imageUrl: detailsData.data.product_photo || detailsData.data.product_photos?.[0] || product.thumbnail,
        rating: detailsData.data.product_star_rating ? parseFloat(detailsData.data.product_star_rating) : undefined,
        totalRatings: detailsData.data.product_num_ratings ? parseInt(detailsData.data.product_num_ratings, 10) : undefined,
        asin: asin,
      };
    }

    // Fallback to search data if details request fails
    const searchPrice = getPriceFromMultipleSources(
      undefined,
      undefined,
      product.price?.current_price
    );
    
    return {
      title: product.title,
      description: product.product_description || product.title,
      price: searchPrice,
      currency: product.price?.currency || 'USD',
      imageUrl: product.product_photo || product.thumbnail,
      rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
      totalRatings: product.product_num_ratings ? parseInt(product.product_num_ratings, 10) : undefined,
      asin: asin,
    };
  } catch (error) {
    console.error('Error in searchAmazonProduct:', error);
    throw error;
  }
}