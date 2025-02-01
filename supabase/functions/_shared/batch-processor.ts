import { AmazonProduct } from './types.ts';
import { searchAmazonProducts } from './amazon-search.ts';

const BATCH_SIZE = 4; // Process 4 items at once
const PROCESS_SIZE = 4; // Process up to 4 items concurrently
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
    
    // Process all items in the batch concurrently
    const batchPromises = batch.map(async (suggestion, index) => {
      try {
        console.log(`Processing suggestion ${batchIndex * BATCH_SIZE + index + 1}: "${suggestion}"`);
        const result = await searchAmazonProducts(suggestion, priceRange);
        console.log(`Processed suggestion ${batchIndex * BATCH_SIZE + index + 1}: "${suggestion}", success: ${!!result}`);
        return result;
      } catch (error) {
        console.error(`Error processing suggestion: "${suggestion}"`, error);
        return null;
      }
    });
    
    // Wait for all promises in the batch to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Filter out null results and add to processed products
    const validResults = batchResults.filter((result): result is AmazonProduct => result !== null);
    console.log(`Found ${validResults.length} valid products in batch ${batchIndex + 1}`);
    processedProducts.push(...validResults);
    
    // Add delay between batches
    if (batchIndex < batches.length - 1) {
      console.log(`Waiting ${BATCH_DELAY}ms before processing next batch`);
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }

  console.log(`Finished processing all batches. Found ${processedProducts.length} valid products`);
  return processedProducts;
}