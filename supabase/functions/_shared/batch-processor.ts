import { AmazonProduct } from './types.ts';
import { searchAmazonProducts } from './amazon-search.ts';

const BATCH_SIZE = 4;
const PROCESS_SIZE = 4;
const BATCH_DELAY = 200;

interface BudgetConstraints {
  min: number;
  max: number;
}

function isWithinBudget(price: number | undefined, budget: BudgetConstraints): boolean {
  if (typeof price !== 'number' || isNaN(price)) {
    console.log('Invalid price:', price);
    return false;
  }
  
  // Allow for 10% tolerance (reduced from 20%)
  const minWithTolerance = budget.min * 0.9;
  const maxWithTolerance = budget.max * 1.1;
  
  const isValid = price >= minWithTolerance && price <= maxWithTolerance;
  
  if (!isValid) {
    console.log(`Price $${price} outside budget range $${budget.min}-$${budget.max} (with 10% tolerance)`);
  }
  
  return isValid;
}

export async function processSuggestionsInBatches(
  suggestions: string[],
  budget?: BudgetConstraints | null
): Promise<AmazonProduct[]> {
  if (budget) {
    console.log('Processing suggestions with budget constraints:', budget);
  }
  
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
            
            // Apply strict budget filtering if constraints exist
            if (budget && result) {
              const price = typeof result.price === 'string' 
                ? parseFloat(result.price.replace(/[^0-9.]/g, ''))
                : result.price;
                
              if (!isWithinBudget(price, budget)) {
                console.log(`Filtered out "${result.title}" - price $${price} outside budget $${budget.min}-$${budget.max}`);
                return null;
              }
            }
            
            return result;
          } catch (error) {
            console.error('Error processing suggestion:', error);
            return null;
          }
        })
      );
      
      // Filter out null results and add to processed products
      const validResults = chunkResults.filter((result): result is AmazonProduct => 
        result !== null && (!budget || isWithinBudget(
          typeof result.price === 'string' 
            ? parseFloat(result.price.replace(/[^0-9.]/g, ''))
            : result.price,
          budget
        ))
      );
      
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

  if (processedProducts.length === 0) {
    console.log('No products found within budget constraints');
  } else {
    console.log(`Found ${processedProducts.length} products within budget constraints`);
  }

  return processedProducts;
}