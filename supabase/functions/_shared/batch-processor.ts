import { searchAmazonProduct } from './amazon-api.ts';
import { generateCustomDescription } from './openai.ts';
import { GiftSuggestion } from './types.ts';

export async function processSuggestionsInBatches(
  suggestions: string[],
  priceRange?: { min: number; max: number }
): Promise<GiftSuggestion[]> {
  const batchSize = 4;
  const processedSuggestions: GiftSuggestion[] = [];
  
  console.log(`Processing ${suggestions.length} suggestions in batches of ${batchSize}`);
  console.log('Using price range:', priceRange || { min: 1, max: 1000 });

  for (let i = 0; i < suggestions.length; i += batchSize) {
    const batch = suggestions.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} with ${batch.length} items`);

    const batchPromises = batch.map(async (suggestion) => {
      try {
        console.log(`Processing suggestion: ${suggestion}`);
        const product = await searchAmazonProduct(suggestion, priceRange);
        
        if (product && product.asin) {
          const customDescription = await generateCustomDescription(
            product.title || suggestion,
            product.description || suggestion
          );

          const reason = `This ${product.title} is a perfect match because it's a high-quality product that fits within your budget and aligns with the recipient's interests. It has ${product.rating ? `an average rating of ${product.rating} stars from ${product.totalRatings} reviews` : 'great reviews'} on Amazon.`;

          return {
            title: product.title || suggestion,
            description: customDescription.replace(/['"]/g, ''),
            priceRange: `${product.currency || 'USD'} ${product.price}`,
            reason: reason.replace(/['"]/g, ''),
            amazon_asin: product.asin,
            amazon_url: `https://www.amazon.com/dp/${product.asin}`,
            amazon_price: product.price,
            amazon_image_url: product.imageUrl,
            amazon_rating: product.rating,
            amazon_total_ratings: product.totalRatings,
            search_query: suggestion,
            status: 'completed'
          };
        }
        
        console.log(`No valid Amazon product found for: ${suggestion}`);
        return null;
      } catch (error) {
        console.error(`Error processing suggestion: ${suggestion}`, error);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    const validResults = batchResults.filter((result): result is GiftSuggestion => result !== null);
    processedSuggestions.push(...validResults);

    if (i + batchSize < suggestions.length) {
      console.log('Waiting before processing next batch...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`Successfully processed ${processedSuggestions.length} suggestions`);
  return processedSuggestions;
}