import { GiftSuggestion } from './types.ts';
import { extractPrice, validatePriceRange, extractPriceRange } from './priceUtils.ts';

function parsePrice(priceString: string): number {
  // Remove currency symbols and convert to number
  const cleanPrice = priceString.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleanPrice);
  return !isNaN(price) && price > 0 ? price : 0;
}

export function filterProducts(
  products: GiftSuggestion[], 
  minBudget: number, 
  maxBudget: number
): GiftSuggestion[] {
  console.log('Filtering products with budget range:', { minBudget, maxBudget });
  
  return products.filter(product => {
    let price: number | undefined;
    
    // First try Amazon price as it's most accurate
    if (typeof product.amazon_price === 'number' && !isNaN(product.amazon_price)) {
      price = product.amazon_price;
    } 
    // Then try price range
    else if (product.priceRange) {
      const range = extractPriceRange(product.priceRange);
      if (range) {
        // Use the average of the range as the price
        price = (range.min + range.max) / 2;
      } else {
        price = parsePrice(product.priceRange);
      }
    }

    if (!price || price <= 0) {
      console.warn('No valid price found for product:', product.title);
      return false;
    }

    const isInBudget = validatePriceRange(price, minBudget, maxBudget);
    
    if (!isInBudget) {
      console.log(`Filtered out product "${product.title}" with price $${price} (budget: $${minBudget}-$${maxBudget})`);
    }
    
    return isInBudget;
  });
}