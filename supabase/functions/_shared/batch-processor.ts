import { GiftSuggestion } from './types.ts';
import { searchProducts } from './amazon-search.ts';
import { validatePriceInRange } from './priceUtils.ts';

export async function processSuggestionsInBatches(
  suggestions: string[], 
  budget: { minBudget: number; maxBudget: number }
): Promise<GiftSuggestion[]> {
  console.log('Processing suggestions with budget constraints:', budget);
  const processedProducts: GiftSuggestion[] = [];

  for (const suggestion of suggestions) {
    try {
      const product = await searchProducts(suggestion);
      
      if (product && product.price) {
        const price = typeof product.price === 'string' 
          ? parseFloat(product.price.replace(/[^0-9.]/g, ''))
          : product.price;

        if (validatePriceInRange(price, budget.minBudget, budget.maxBudget)) {
          processedProducts.push({
            title: product.title,
            description: product.description,
            priceRange: `USD ${price}`,
            reason: `This product fits within your budget range of $${budget.minBudget}-$${budget.maxBudget}`,
            amazon_asin: product.asin,
            amazon_url: product.url,
            amazon_price: price,
            amazon_image_url: product.imageUrl,
            amazon_rating: product.rating,
            amazon_total_ratings: product.totalRatings,
            status: 'completed'
          });
        } else {
          console.log(`Product "${product.title}" price $${price} outside budget range $${budget.minBudget}-$${budget.maxBudget}`);
        }
      }
    } catch (error) {
      console.error(`Error processing suggestion "${suggestion}":`, error);
    }
  }

  return processedProducts;
}