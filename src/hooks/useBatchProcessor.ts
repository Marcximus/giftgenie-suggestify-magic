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
      parallel = true // Enable parallel processing by default
    } = options;

    setIsProcessing(true);
    const results: R[] = [];
    
    try {
      // Process items in batches
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        if (parallel) {
          // Process all items in the batch simultaneously
          const batchPromises = batch.map(item => 
            processFn(item).catch(error => {
              onError(error, item);
              return null;
            })
          );
          
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
              onError(error, item);
            }
          }
        }
      }
    } finally {
      setIsProcessing(false);
    }

    return results;
  };

  return {
    processBatch,
    isProcessing
  };
};