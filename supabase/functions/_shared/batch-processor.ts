import { AmazonProduct } from './types.ts';
import { searchAmazonProducts } from './amazon-search.ts';

const BATCH_SIZE = 3;
const BATCH_DELAY = 1000; // 1 second delay between batches to avoid rate limits

export async function processSuggestionsInBatches(suggestions: string[]): Promise<AmazonProduct[]> {
  const batches: string[][] = [];
  const processedProducts: AmazonProduct[] = [];
  
  // Split suggestions into batches
  for (let i = 0; i < suggestions.length; i += BATCH_SIZE) {
    batches.push(suggestions.slice(i, i + BATCH_SIZE));
  }

  console.log(`Processing ${suggestions.length} suggestions in ${batches.length} batches`);
  
  for (const [index, batch] of batches.entries()) {
    console.log(`Processing batch ${index + 1} of ${batches.length} with ${batch.length} suggestions`);
    
    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (suggestion) => {
        try {
          const product = await searchAmazonProducts(suggestion);
          if (product) {
            console.log(`Successfully processed product: ${product.title}`);
            return product;
          } else {
            console.log(`No product found for suggestion: ${suggestion}`);
            return null;
          }
        } catch (error) {
          console.error('Error processing suggestion:', error);
          return null;
        }
      })
    );
    
    // Filter out null results and add to processed products
    const validResults = batchResults.filter((result): result is AmazonProduct => result !== null);
    processedProducts.push(...validResults);
    
    // Add delay between batches to avoid rate limits, except for the last batch
    if (index < batches.length - 1) {
      console.log(`Waiting ${BATCH_DELAY}ms before processing next batch...`);
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }

  console.log(`Finished processing all batches. Found ${processedProducts.length} valid products`);
  return processedProducts;
}