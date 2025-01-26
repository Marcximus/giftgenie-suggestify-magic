import { GiftSuggestion } from './types.ts';
import { extractPrice, validatePriceRange, extractPriceRange } from './priceUtils.ts';

export function filterProducts(
  products: GiftSuggestion[], 
  minBudget: number, 
  maxBudget: number
): GiftSuggestion[] {
  console.log('Filtering products with budget range:', { minBudget, maxBudget });
  
  return products.filter(product => {
    // First try Amazon price as it's most accurate
    let price = product.amazon_price;
    
    // Then try price range if Amazon price isn't available
    if (!price && product.priceRange) {
      const range = extractPriceRange(product.priceRange);
      if (range) {
        // Use the average of the range
        price = (range.min + range.max) / 2;
      }
    }

    if (!price || price <= 0) {
      console.log('No valid price found for product:', product.title);
      return false;
    }

    const isInBudget = validatePriceRange(price, minBudget, maxBudget);
    
    if (!isInBudget) {
      console.log(`Filtered out product "${product.title}" with price $${price} (budget: $${minBudget}-$${maxBudget})`);
    }
    
    return isInBudget;
  });
}