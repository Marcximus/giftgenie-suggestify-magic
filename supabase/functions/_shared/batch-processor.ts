import { AmazonProduct } from './types.ts';
import { searchAmazonProducts } from './amazon-search.ts';

const BATCH_SIZE = 3;
const BATCH_DELAY = 100;

export async function processSuggestionsInBatches(suggestions: string[]): Promise<AmazonProduct[]> {
  const batches: string[][] = [];
  
  // Split suggestions into batches
  for (let i = 0; i < suggestions.length; i += BATCH_SIZE) {
    batches.push(suggestions.slice(i, i + BATCH_SIZE));
  }

  const processedProducts: AmazonProduct[] = [];
  
  for (const batch of batches) {
    console.log(`Processing batch of ${batch.length} suggestions`);
    
    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (suggestion) => {
        try {
          return await searchAmazonProducts(suggestion);
        } catch (error) {
          console.error('Error processing suggestion:', error);
          return null;
        }
      })
    );
    
    // Filter out null results and add to processed products
    processedProducts.push(...batchResults.filter((result): result is AmazonProduct => result !== null));
    
    // Add delay between batches to avoid rate limits
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }

  return processedProducts;
}