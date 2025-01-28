import { useState } from 'react';
import { AMAZON_CONFIG } from '@/utils/amazon/config';
import { sleep, isRateLimited, logRequest } from '@/utils/amazon/rateLimiter';
import { toast } from "@/components/ui/use-toast";
import { amazonRequestQueue } from '@/utils/amazon/requestQueue';

interface BatchProcessorOptions<T, R> {
  processFn: (item: T) => Promise<R>;
  onError?: (error: any, item: T) => void;
  batchSize?: number;
  staggerDelay?: number;
  parallel?: boolean;
  endpoint?: string;
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
      batchSize = AMAZON_CONFIG.BATCH_SIZE,
      staggerDelay = AMAZON_CONFIG.STAGGER_DELAY,
      parallel = true,
      endpoint = 'default'
    } = options;

    setIsProcessing(true);
    setProcessingQueue(items);
    
    const results: R[] = [];
    const errors: any[] = [];
    const processedItems = new Set<number>();
    
    try {
      for (let i = 0; i < items.length; i += batchSize) {
        if (isRateLimited(endpoint)) {
          console.log('Rate limit reached, waiting before processing next batch');
          toast({
            title: "Processing paused",
            description: "Waiting a moment before continuing...",
            variant: "destructive",
          });
          await sleep(AMAZON_CONFIG.BASE_RETRY_DELAY);
        }

        const batch = items.slice(i, i + batchSize);
        
        if (parallel) {
          const batchPromises = batch.map(async (item, index) => {
            const globalIndex = i + index;
            try {
              if (index > 0) await sleep(staggerDelay);
              logRequest(endpoint);
              
              // Queue the request with priority based on index
              const result = await amazonRequestQueue.add(
                () => processFn(item),
                items.length - globalIndex // Higher priority for earlier items
              );
              
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
              logRequest(endpoint);
              const result = await amazonRequestQueue.add(
                () => processFn(item),
                items.length - globalIndex
              );
              results.push(result);
              processedItems.add(globalIndex);
              setProcessingQueue(prev => prev.filter((_, idx) => !processedItems.has(idx)));
              if (staggerDelay > 0) await sleep(staggerDelay);
            } catch (error) {
              errors.push({ error, item });
              onError(error, item);
            }
          }
        }

        if (i + batchSize < items.length) {
          await sleep(AMAZON_CONFIG.BASE_RETRY_DELAY);
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