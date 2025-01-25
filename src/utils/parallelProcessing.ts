import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const BATCH_SIZE = 8;
const MAX_CONCURRENT = 4;
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
  
  console.log(`Processing ${items.length} items in ${batches.length} batches`);
  
  for (const batch of batches) {
    const batchStartTime = performance.now();
    console.log(`Starting batch of ${batch.length} items`);
    
    // Process items in the current batch concurrently
    const batchPromises = batch.map(async (item, index) => {
      // Stagger requests within batch to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, index * 50));
      
      try {
        return await processFn(item);
      } catch (error) {
        console.error('Error processing item:', error);
        return null;
      }
    });
    
    // Wait for all items in the batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((r): r is NonNullable<Awaited<R>> => r !== null));
    
    const batchDuration = performance.now() - batchStartTime;
    console.log(`Batch completed in ${batchDuration.toFixed(2)}ms`);
    
    // Log metrics
    await supabase.from('api_metrics').insert({
      endpoint: 'parallel-processing',
      duration_ms: Math.round(batchDuration),
      status: 'success'
    });
    
    // Add delay between batches to prevent rate limiting
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, options.delayBetweenBatches));
    }
  }
  
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
  
  toast({
    title: "Processing Error",
    description: "Failed to process some items. Please try again.",
    variant: "destructive",
  });
  
  throw lastError;
}