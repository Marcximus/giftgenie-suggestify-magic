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
  const [processingQueue, setProcessingQueue] = useState<T[]>([]);

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
    setProcessingQueue(items);
    
    const results: R[] = [];
    const errors: any[] = [];
    const processedItems = new Set<number>();
    
    try {
      // Process items in chunks with improved concurrency
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        if (parallel) {
          // Process batch items concurrently with improved error handling
          const batchPromises = batch.map(async (item, index) => {
            const globalIndex = i + index;
            try {
              if (index > 0) await sleep(staggerDelay / 2); // Reduced delay for faster processing
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
          // Sequential processing with progress tracking
          for (const [index, item] of batch.entries()) {
            const globalIndex = i + index;
            try {
              const result = await processFn(item);
              results.push(result);
              processedItems.add(globalIndex);
              setProcessingQueue(prev => prev.filter((_, idx) => !processedItems.has(idx)));
              if (staggerDelay > 0) await sleep(staggerDelay / 2);
            } catch (error) {
              errors.push({ error, item });
              onError(error, item);
            }
          }
        }

        // Add a small delay between batches to prevent rate limiting
        if (i + batchSize < items.length) {
          await sleep(AMAZON_CONFIG.BASE_RETRY_DELAY / 2);
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