import { useState } from 'react';
import { AMAZON_CONFIG } from '@/utils/amazon/config';
import { sleep } from '@/utils/amazon/rateLimiter';

interface BatchProcessorOptions<T, R> {
  processFn: (item: T) => Promise<R>;
  onError?: (error: any, item: T) => void;
  batchSize?: number;
  staggerDelay?: number;
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
      staggerDelay = AMAZON_CONFIG.STAGGER_DELAY
    } = options;

    setIsProcessing(true);
    const results: R[] = [];
    
    try {
      // Process items in batches
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (item, index) => {
          try {
            // Add stagger delay after first request
            if (index > 0) {
              await sleep(staggerDelay);
            }
            return await processFn(item);
          } catch (error) {
            onError(error, item);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter(Boolean));
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