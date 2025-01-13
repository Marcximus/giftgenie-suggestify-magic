import { searchProducts } from './api/productSearch.ts';
import { getProductDetails } from './api/productDetails.ts';
import { simplifySearchTerm } from './utils/textUtils.ts';
import { getFallbackSearchTerms } from './utils/searchTermUtils.ts';
import { AmazonProduct } from './types.ts';

export async function searchAmazonProduct(
  searchTerm: string, 
  apiKey: string, 
  ageCategory?: string
): Promise<AmazonProduct | null> {
  console.log('Initial search attempt for:', searchTerm, 'Age category:', ageCategory);

  try {
    // First try with exact search term
    let product = await searchProducts(searchTerm, apiKey);
    
    // If no products found, try with generic search term
    if (!product) {
      const genericSearchTerm = simplifySearchTerm(searchTerm);
      console.log('Attempting search with generic term:', genericSearchTerm);
      product = await searchProducts(genericSearchTerm, apiKey);
    }
    
    // If still no products found, try with fallback search terms
    if (!product) {
      const fallbackTerms = getFallbackSearchTerms(searchTerm, ageCategory);
      
      for (const term of fallbackTerms) {
        console.log('Attempting fallback search with:', term);
        product = await searchProducts(term, apiKey);
        if (product) {
          console.log('Found product with fallback term:', term);
          break;
        }
      }
    }

    if (!product) {
      console.log('No products found with any search attempt');
      return null;
    }

    // Get detailed product information
    console.log('Getting details for ASIN:', product.asin);
    const detailedProduct = await getProductDetails(product.asin, apiKey);

    // Return detailed product if available, otherwise return basic product info
    return detailedProduct || product;

  } catch (error) {
    console.error('Error in searchAmazonProduct:', error);
    throw error;
  }
}