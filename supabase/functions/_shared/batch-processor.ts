import { AmazonProduct } from './types.ts';
import { searchAmazonProducts } from './amazon-search.ts';

const BATCH_SIZE = 2;
const PROCESS_SIZE = 2;
const BATCH_DELAY = 200;

export async function processSuggestionsInBatches(
  suggestions: string[],
  priceRange?: string
): Promise<AmazonProduct[]> {
  console.log(`Processing ${suggestions.length} suggestions with price range: ${priceRange}`);
  
  const batches: string[][] = [];
  
  // Split suggestions into batches of BATCH_SIZE
  for (let i = 0; i < suggestions.length; i += BATCH_SIZE) {
    batches.push(suggestions.slice(i, i + BATCH_SIZE));
  }

  console.log(`Split into ${batches.length} batches of ${BATCH_SIZE} items each`);
  const processedProducts: AmazonProduct[] = [];
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`Processing batch ${batchIndex + 1} of ${batches.length} with ${batch.length} items`);
    
    // Process batch in smaller chunks
    for (let i = 0; i < batch.length; i += PROCESS_SIZE) {
      const chunk = batch.slice(i, i + PROCESS_SIZE);
      console.log(`Processing chunk ${Math.floor(i/PROCESS_SIZE) + 1} of batch ${batchIndex + 1} with ${chunk.length} items`);
      
      // Process chunk in parallel
      const chunkResults = await Promise.all(
        chunk.map(async (suggestion) => {
          try {
            console.log(`Processing suggestion: "${suggestion}"`);
            const result = await searchAmazonProducts(suggestion, priceRange);
            console.log(`Processed suggestion: "${suggestion}", success: ${!!result}`);
            return result;
          } catch (error) {
            console.error(`Error processing suggestion: "${suggestion}"`, error);
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
    if (batchIndex < batches.length - 1) {
      console.log(`Waiting ${BATCH_DELAY}ms before processing next batch`);
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }

  console.log(`Finished processing all batches. Found ${processedProducts.length} valid products`);
  return processedProducts;
}