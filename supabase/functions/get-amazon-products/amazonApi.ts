import { performSearch, simplifySearchTerm, getFallbackSearchTerms } from './searchUtils.ts';
import { getProductDetails } from './productDetails.ts';
import { getPriceFromMultipleSources } from './priceUtils.ts';
import { AmazonProduct } from './types.ts';

const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

export async function searchAmazonProduct(searchTerm: string, apiKey: string): Promise<AmazonProduct | null> {
  console.log('Initial search attempt for:', searchTerm);

  try {
    // First try with exact search term
    console.log('Attempting search with exact term:', searchTerm);
    let searchData = await performSearch(searchTerm, apiKey, RAPIDAPI_HOST);
    
    // If no products found, try with generic search term
    if (!searchData.data?.products?.length) {
      const genericSearchTerm = simplifySearchTerm(searchTerm);
      console.log('Attempting search with generic term:', genericSearchTerm);
      searchData = await performSearch(genericSearchTerm, apiKey, RAPIDAPI_HOST);
    }
    
    // If still no products found, try with fallback search terms
    if (!searchData.data?.products?.length) {
      const fallbackTerms = getFallbackSearchTerms(searchTerm);
      
      for (const term of fallbackTerms) {
        console.log('Attempting fallback search with:', term);
        searchData = await performSearch(term, apiKey, RAPIDAPI_HOST);
        if (searchData.data?.products?.length) {
          console.log('Found product with fallback term:', term);
          break;
        }
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
    console.log('Getting details for ASIN:', asin);
    const detailsData = await getProductDetails(asin, apiKey, RAPIDAPI_HOST);

    // Log raw product details for debugging
    console.log('Raw product details:', {
      title: detailsData?.data?.product_title,
      price: detailsData?.data?.product_price,
      rating: detailsData?.data?.product_star_rating,
      totalRatings: detailsData?.data?.product_num_ratings
    });

    if (detailsData?.data) {
      // Extract price from search data if details don't have it
      const priceStr = detailsData.data.product_price || 
                      product.product_price;
      
      // Convert price string to number, removing currency symbol and commas
      const price = priceStr ? parseFloat(priceStr.replace(/[$,]/g, '')) : undefined;

      // Convert rating to number, handling string values
      const rating = detailsData.data.product_star_rating ? 
        parseFloat(detailsData.data.product_star_rating) : 
        (product.product_star_rating ? parseFloat(product.product_star_rating) : undefined);

      // Convert total ratings to number
      const totalRatings = detailsData.data.product_num_ratings ? 
        parseInt(detailsData.data.product_num_ratings.toString(), 10) : 
        (product.product_num_ratings ? parseInt(product.product_num_ratings.toString(), 10) : undefined);

      // Log the processed values
      console.log('Processed product details:', {
        price,
        rating,
        totalRatings,
        currency: detailsData.data.currency || 'USD'
      });

      return {
        title: detailsData.data.product_title || product.title,
        description: detailsData.data.product_description || product.product_description || product.title,
        price,
        currency: detailsData.data.currency || 'USD',
        imageUrl: detailsData.data.product_photo || detailsData.data.product_photos?.[0] || product.thumbnail,
        rating,
        totalRatings,
        asin: asin,
      };
    }

    // Fallback to search data if details request fails
    console.log('Falling back to search data for product details');
    
    // Extract price from search data
    const searchPrice = product.product_price ? 
      parseFloat(product.product_price.replace(/[$,]/g, '')) : undefined;
    
    // Extract rating from search data
    const searchRating = product.product_star_rating ? 
      parseFloat(product.product_star_rating) : undefined;

    // Extract total ratings from search data
    const searchTotalRatings = product.product_num_ratings ? 
      parseInt(product.product_num_ratings.toString(), 10) : undefined;

    // Log fallback data
    console.log('Using fallback search data:', {
      price: searchPrice,
      rating: searchRating,
      totalRatings: searchTotalRatings
    });

    return {
      title: product.title,
      description: product.product_description || product.title,
      price: searchPrice,
      currency: product.currency || 'USD',
      imageUrl: product.product_photo || product.thumbnail,
      rating: searchRating,
      totalRatings: searchTotalRatings,
      asin: asin,
    };
  } catch (error) {
    console.error('Error in searchAmazonProduct:', error);
    throw error;
  }
}