import { useState } from 'react';
import { AMAZON_CONFIG } from '@/utils/amazon/config';
import { sleep, waitForRateLimit } from '@/utils/amazon/rateLimiter';

interface BatchProcessorOptions<T, R> {
  processFn: (item: T) => Promise<R>;
  onError?: (error: any, item: T) => void;
  batchSize?: number;
  staggerDelay?: number;
  parallel?: boolean;
}

export const useBatchProcessor = <T, R>() => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingQueue, setProcessingQueue] = useState<T[]>([]);

  const processBatch = async (
    items: T[],
    options: BatchProcessorOptions<T, R>
  ): Promise<R[]> => {
    const {
      processFn,
      onError = console.error,
      batchSize = 2,
      staggerDelay = AMAZON_CONFIG.STAGGER_DELAY,
      parallel = false
    } = options;

    setIsProcessing(true);
    setProcessingQueue(items);
    
    const results: R[] = [];
    const errors: any[] = [];
    const processedItems = new Set<number>();
    
    try {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        if (parallel) {
          const batchPromises = batch.map(async (item, index) => {
            const globalIndex = i + index;
            try {
              await waitForRateLimit();
              await sleep(staggerDelay * index);
              const result = await processFn(item);
              processedItems.add(globalIndex);
              setProcessingQueue(prev => prev.filter((_, idx) => !processedItems.has(idx)));
              return result;
            } catch (error) {
              errors.push({ error, item });
              onError(error, item);
              return null;
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults.filter(Boolean));
        } else {
          for (const [index, item] of batch.entries()) {
            const globalIndex = i + index;
            try {
              await waitForRateLimit();
              const result = await processFn(item);
              results.push(result);
              processedItems.add(globalIndex);
              setProcessingQueue(prev => prev.filter((_, idx) => !processedItems.has(idx)));
              await sleep(staggerDelay);
            } catch (error) {
              errors.push({ error, item });
              onError(error, item);
            }
          }
        }

        if (i + batchSize < items.length) {
          await sleep(AMAZON_CONFIG.BASE_RETRY_DELAY * 2);
        }
      }
    } finally {
      setIsProcessing(false);
      setProcessingQueue([]);
    }

    if (errors.length > 0) {
      console.warn(`Batch processing completed with ${errors.length} errors:`, errors);
    }

    return results;
  };

  return {
    processBatch,
    isProcessing,
    processingQueue
  };
};