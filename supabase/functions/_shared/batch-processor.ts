import { AmazonProduct } from './types.ts';
import { searchAmazonProducts } from './amazon-search.ts';

const BATCH_SIZE = 8; // Increased from 4 to 8
const PROCESS_SIZE = 4; // Keep process size at 4 to maintain rate limiting
const BATCH_DELAY = 200;

export async function processSuggestionsInBatches(suggestions: string[]): Promise<AmazonProduct[]> {
  const batches: string[][] = [];
  
  // Split suggestions into batches
  for (let i = 0; i < suggestions.length; i += BATCH_SIZE) {
    batches.push(suggestions.slice(i, i + BATCH_SIZE));
  }

  const processedProducts: AmazonProduct[] = [];
  
  for (const batch of batches) {
    console.log(`Processing batch of ${batch.length} suggestions`);
    
    // Process batch in smaller chunks
    for (let i = 0; i < batch.length; i += PROCESS_SIZE) {
      const chunk = batch.slice(i, i + PROCESS_SIZE);
      console.log(`Processing chunk of ${chunk.length} items from batch`);
      
      // Process chunk in parallel
      const chunkResults = await Promise.all(
        chunk.map(async (suggestion) => {
          try {
            const result = await searchAmazonProducts(suggestion);
            console.log(`Processed suggestion: ${suggestion}, success: ${!!result}`);
            return result;
          } catch (error) {
            console.error('Error processing suggestion:', error);
            return null;
          }
        })
      );
      
      // Filter out null results and add to processed products
      processedProducts.push(...chunkResults.filter((result): result is AmazonProduct => result !== null));
      
      // Add delay between chunks within a batch
      if (i + PROCESS_SIZE < batch.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY / 2));
      }
    }
    
    // Add delay between batches
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }

  return processedProducts;
}