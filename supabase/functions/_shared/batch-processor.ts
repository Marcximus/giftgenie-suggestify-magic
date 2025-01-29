import { AmazonProduct } from './types.ts';
import { searchAmazonProducts } from './amazon-search.ts';

const BATCH_SIZE = 4;
const PROCESS_SIZE = 4;
const BATCH_DELAY = 200;

interface BudgetConstraints {
  min: number;
  max: number;
}

function isWithinBudget(price: number, budget: BudgetConstraints): boolean {
  if (!price || isNaN(price)) return false;
  
  // Allow for 20% tolerance
  const minWithTolerance = budget.min * 0.8;
  const maxWithTolerance = budget.max * 1.2;
  
  return price >= minWithTolerance && price <= maxWithTolerance;
}

export async function processSuggestionsInBatches(
  suggestions: string[],
  budget?: BudgetConstraints | null
): Promise<AmazonProduct[]> {
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
            
            // Apply budget filtering if constraints exist
            if (budget && result) {
              const price = typeof result.price === 'string' 
                ? parseFloat(result.price.replace(/[^0-9.]/g, ''))
                : result.price;
                
              if (!isWithinBudget(price, budget)) {
                console.log(`Product "${result.title}" price $${price} outside budget range $${budget.min}-$${budget.max}`);
                return null;
              }
            }
            
            console.log(`Processed suggestion: ${suggestion}, success: ${!!result}`);
            return result;
          } catch (error) {
            console.error('Error processing suggestion:', error);
            return null;
          }
        })
      );
      
      // Filter out null results and add to processed products
      processedProducts.push(...chunkResults.filter((result): result is AmazonProduct => 
        result !== null && (!budget || isWithinBudget(
          typeof result.price === 'string' 
            ? parseFloat(result.price.replace(/[^0-9.]/g, ''))
            : result.price,
          budget
        ))
      ));
      
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