import { useState } from 'react';
import { AMAZON_CONFIG } from '@/utils/amazon/config';
import { sleep } from '@/utils/amazon/rateLimiter';

interface BatchProcessorOptions<T, R> {
  processFn: (item: T) => Promise<R>;
  onError?: (error: any, item: T) => void;
  batchSize?: number;
  staggerDelay?: number;
  parallel?: boolean;
}

export const useBatchProcessor = <T, R>() => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processBatch = async (
    items: T[],
    options: BatchProcessorOptions<T, R>
  ): Promise<R[]> => {
    const {
      processFn,
      onError = console.error,
      batchSize = AMAZON_CONFIG.MAX_CONCURRENT_REQUESTS,
      staggerDelay = AMAZON_CONFIG.STAGGER_DELAY,
      parallel = true
    } = options;

    setIsProcessing(true);
    const results: R[] = [];
    const errors: any[] = [];
    
    try {
      // Process items in chunks to avoid overwhelming the system
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        if (parallel) {
          // Process batch items concurrently with Promise.all
          const batchPromises = batch.map(async (item, index) => {
            try {
              // Add minimal stagger even in parallel mode to prevent rate limits
              if (index > 0) await sleep(staggerDelay);
              return await processFn(item);
            } catch (error) {
              errors.push({ error, item });
              onError(error, item);
              return null;
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults.filter(Boolean));
        } else {
          // Process items sequentially with stagger delay
          for (const item of batch) {
            try {
              const result = await processFn(item);
              if (result) results.push(result);
              if (staggerDelay > 0) await sleep(staggerDelay);
            } catch (error) {
              errors.push({ error, item });
              onError(error, item);
            }
          }
        }

        // Add a small delay between batches to prevent rate limiting
        if (i + batchSize < items.length) {
          await sleep(AMAZON_CONFIG.BASE_RETRY_DELAY);
        }
      }
    } finally {
      setIsProcessing(false);
    }

    // Log any errors that occurred during processing
    if (errors.length > 0) {
      console.warn(`Batch processing completed with ${errors.length} errors:`, errors);
    }

    return results;
  };

  return {
    processBatch,
    isProcessing
  };
};