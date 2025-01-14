import { GiftSuggestion } from './types.ts';

function parsePrice(priceString: string): number {
  // Remove currency symbols and convert to number
  const cleanPrice = priceString.replace(/[^\d.-]/g, '');
  return parseFloat(cleanPrice);
}

export function filterProducts(
  products: GiftSuggestion[], 
  minBudget: number, 
  maxBudget: number
): GiftSuggestion[] {
  return products.filter(product => {
    let price: number;
    
    if (product.amazon_price) {
      price = product.amazon_price;
    } else if (product.priceRange) {
      price = parsePrice(product.priceRange);
    } else {
      console.warn('No price available for product:', product.title);
      return false;
    }

    // Allow for a 20% margin above and below the budget range
    const minAllowed = minBudget * 0.8;
    const maxAllowed = maxBudget * 1.2;

    const isInBudget = price >= minAllowed && price <= maxAllowed;
    
    if (!isInBudget) {
      console.log(`Filtered out product "${product.title}" with price $${price} (budget: $${minBudget}-$${maxBudget})`);
    }
    
    return isInBudget;
  });
}