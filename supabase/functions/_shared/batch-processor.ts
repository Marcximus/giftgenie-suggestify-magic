import { AmazonProduct } from './types.ts';
import { searchAmazonProducts } from './amazon-search.ts';

const BATCH_SIZE = 8;
const PROCESS_SIZE = 4;
const BATCH_DELAY = 200;

export async function processSuggestionsInBatches(
  suggestions: string[],
  priceRange?: string
): Promise<AmazonProduct[]> {
  console.log(`Processing ${suggestions.length} suggestions with price range: ${priceRange}`);
  
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
            const result = await searchAmazonProducts(suggestion, priceRange);
            console.log(`Processed suggestion: ${suggestion}, success: ${!!result}`);
            return result;
          } catch (error) {
            console.error('Error processing suggestion:', error);
            return null;
          }
        })
      );
      
      // Filter out null results and add to processed products
      const validResults = chunkResults.filter((result): result is AmazonProduct => result !== null);
      console.log(`Found ${validResults.length} valid products in chunk`);
      processedProducts.push(...validResults);
      
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

  console.log(`Finished processing. Found ${processedProducts.length} valid products`);
  return processedProducts;
}