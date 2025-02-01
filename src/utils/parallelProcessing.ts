import { supabase } from "@/integrations/supabase/client";
import { logApiMetrics } from './metricsUtils';

const BATCH_SIZE = 4; // Process 4 items at once
const MAX_CONCURRENT = 4; // Allow up to 4 concurrent operations
const DELAY_BETWEEN_BATCHES = 200;

export async function processInParallel<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  options = { 
    batchSize: BATCH_SIZE,
    maxConcurrent: MAX_CONCURRENT,
    delayBetweenBatches: DELAY_BETWEEN_BATCHES 
  }
): Promise<R[]> {
  const results: R[] = [];
  const batches: T[][] = [];
  
  // Split items into batches
  for (let i = 0; i < items.length; i += options.batchSize) {
    batches.push(items.slice(i, i + options.batchSize));
  }
  
  console.log(`Processing ${items.length} items in ${batches.length} batches of ${options.batchSize} items each`);
  
  for (const [batchIndex, batch] of batches.entries()) {
    const batchStartTime = performance.now();
    console.log(`Starting batch ${batchIndex + 1} of ${batches.length} with ${batch.length} items`);
    
    // Process items in the current batch concurrently
    const batchPromises = batch.map(async (item, index) => {
      // Stagger requests within batch to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, index * 50));
      
      try {
        const result = await processFn(item);
        console.log(`Successfully processed item ${batchIndex * options.batchSize + index + 1} of ${items.length}`);
        return result;
      } catch (error) {
        console.error(`Error processing item ${batchIndex * options.batchSize + index + 1}:`, error);
        return null;
      }
    });
    
    // Wait for all items in the batch to complete
    const batchResults = await Promise.all(batchPromises);
    const validResults = batchResults.filter((r): r is NonNullable<R> => r !== null);
    results.push(...validResults);
    
    const batchDuration = performance.now() - batchStartTime;
    console.log(`Batch ${batchIndex + 1} completed in ${batchDuration.toFixed(2)}ms with ${validResults.length} successful results`);
    
    // Log metrics
    await supabase.from('api_metrics').insert({
      endpoint: 'parallel-processing',
      duration_ms: Math.round(batchDuration),
      status: 'success'
    });
    
    // Add delay between batches if not the last batch
    if (batchIndex < batches.length - 1) {
      console.log(`Waiting ${options.delayBetweenBatches}ms before processing next batch`);
      await new Promise(resolve => setTimeout(resolve, options.delayBetweenBatches));
    }
  }
  
  console.log(`Parallel processing completed. Processed ${results.length} items successfully`);
  return results;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${i + 1} failed:`, error);
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}