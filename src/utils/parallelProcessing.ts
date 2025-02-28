
import { supabase } from "@/integrations/supabase/client";
import { logApiMetrics } from './metricsUtils';

const BATCH_SIZE = 4; // Process 4 items at once
const MAX_CONCURRENT = 4; // Allow up to 4 concurrent operations
const DELAY_BETWEEN_BATCHES = 150; // Reduced from 200ms to 150ms
const DELAY_WITHIN_BATCH = 30; // Reduced staggering delay within batches

export async function processInParallel<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  options = { 
    batchSize: BATCH_SIZE,
    maxConcurrent: MAX_CONCURRENT,
    delayBetweenBatches: DELAY_BETWEEN_BATCHES,
    delayWithinBatch: DELAY_WITHIN_BATCH,
    priority: [] as T[] // Items to process first
  }
): Promise<R[]> {
  const results: R[] = [];
  
  // Prioritize items if priority list provided
  let prioritizedItems = [...items];
  if (options.priority && options.priority.length > 0) {
    // Move priority items to the front
    prioritizedItems = [
      ...items.filter(item => options.priority.includes(item)),
      ...items.filter(item => !options.priority.includes(item))
    ];
  }
  
  // Split items into batches
  const batches: T[][] = [];
  for (let i = 0; i < prioritizedItems.length; i += options.batchSize) {
    batches.push(prioritizedItems.slice(i, i + options.batchSize));
  }
  
  console.log(`Processing ${items.length} items in ${batches.length} batches of ${options.batchSize} items each`);
  
  // Process batches with improved efficiency
  for (const [batchIndex, batch] of batches.entries()) {
    const batchStartTime = performance.now();
    console.log(`Starting batch ${batchIndex + 1} of ${batches.length} with ${batch.length} items`);
    
    // Process items in the current batch concurrently
    const batchPromises = batch.map(async (item, index) => {
      // Stagger requests within batch to prevent rate limiting, but use shorter delay
      await new Promise(resolve => setTimeout(resolve, index * options.delayWithinBatch));
      
      try {
        const result = await processFn(item);
        console.log(`Successfully processed item ${batchIndex * options.batchSize + index + 1} of ${items.length}`);
        
        // Immediately add the result to the results array so it can be displayed
        results.push(result);
        
        // Allow parent components to receive results immediately
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('item-processed', { 
            detail: { result, index: batchIndex * options.batchSize + index } 
          }));
        }
        
        return result;
      } catch (error) {
        console.error(`Error processing item ${batchIndex * options.batchSize + index + 1}:`, error);
        return null;
      }
    });
    
    // Wait for all items in the batch to complete
    await Promise.all(batchPromises);
    
    const batchDuration = performance.now() - batchStartTime;
    console.log(`Batch ${batchIndex + 1} completed in ${batchDuration.toFixed(2)}ms`);
    
    // Adaptive delay: reduce delay for subsequent batches if previous batch was fast
    let nextDelay = options.delayBetweenBatches;
    if (batchDuration < 1000) {
      nextDelay = Math.max(50, nextDelay / 2); // Reduce delay but not below 50ms
    }
    
    // Log metrics after each batch
    await logApiMetrics('parallel-processing-batch', batchDuration, 'success');
    
    // Add delay between batches if not the last batch
    if (batchIndex < batches.length - 1) {
      console.log(`Waiting ${nextDelay}ms before processing next batch`);
      await new Promise(resolve => setTimeout(resolve, nextDelay));
    }
  }
  
  console.log(`Parallel processing completed. Processed ${results.length} items successfully`);
  
  // Return the collected results
  return results.filter((r): r is Awaited<R> => r !== null);
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
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(1.5, i) * (0.9 + Math.random() * 0.2);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Add a new utility function for processing with progressive results
export async function processWithProgressiveResults<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  onProgress: (result: R, index: number) => void,
  options = {
    batchSize: BATCH_SIZE,
    delayBetweenBatches: DELAY_BETWEEN_BATCHES
  }
): Promise<R[]> {
  const results: R[] = [];
  const processedIndexes = new Set<number>();
  
  // Create an event listener for progress updates
  const handleProgress = (event: CustomEvent) => {
    const { result, index } = event.detail;
    if (result && !processedIndexes.has(index)) {
      processedIndexes.add(index);
      onProgress(result, index);
    }
  };
  
  // Add event listener for progress updates
  if (typeof window !== 'undefined') {
    window.addEventListener('item-processed', handleProgress as EventListener);
  }
  
  try {
    // Process the items using parallel processing
    const processedResults = await processInParallel(items, processFn, options);
    results.push(...processedResults);
  } finally {
    // Clean up the event listener
    if (typeof window !== 'undefined') {
      window.removeEventListener('item-processed', handleProgress as EventListener);
    }
  }
  
  return results;
}
