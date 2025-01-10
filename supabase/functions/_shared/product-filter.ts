import { GiftSuggestion } from './types.ts';

export function filterProducts(products: GiftSuggestion[], minBudget: number, maxBudget: number): GiftSuggestion[] {
  return products.filter(product => {
    const price = product.amazon_price || parseFloat(product.priceRange.replace(/[^\d.]/g, ''));
    return price >= minBudget * 0.8 && price <= maxBudget * 1.2;
  });
}