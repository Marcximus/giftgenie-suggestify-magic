import { useState, useCallback } from 'react';
import { useAmazonProducts } from './useAmazonProducts';

const BATCH_SIZE = 4;
const DELAY_BETWEEN_BATCHES = 1000;

export const useBatchProcessor = () => {
  const { getAmazonProduct } = useAmazonProducts();
  const [isProcessing, setIsProcessing] = useState(false);

  const processBatch = useCallback(async <T>(
    items: T[],
    processItem: (item: T) => Promise<any>,
    onProgress?: (processed: number, total: number) => void
  ) => {
    setIsProcessing(true);
    const results = [];
    
    try {
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(item => processItem(item));
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        results.push(...batchResults.map(result => 
          result.status === 'fulfilled' ? result.value : null
        ));
        
        if (onProgress) {
          onProgress(i + batch.length, items.length);
        }
        
        if (i + BATCH_SIZE < items.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
      }
    } finally {
      setIsProcessing(false);
    }
    
    return results;
  }, []);

  return {
    processBatch,
    isProcessing
  };
};