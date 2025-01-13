import { useState } from 'react';
import { AmazonProduct } from '@/utils/amazon/types';
import { calculateBackoffDelay, sleep } from '@/utils/amazon/rateLimiter';
import { AMAZON_CONFIG } from '@/utils/amazon/config';
import { searchWithFallback } from '@/utils/amazon/searchUtils';
import { getCachedProduct, cacheProduct } from '@/utils/amazon/cacheUtils';
import { withRetry } from '@/utils/amazon/retryUtils';
import { toast } from "@/components/ui/use-toast";

// Global request queue
const requestQueue: Array<() => Promise<void>> = [];
let isProcessing = false;

// Process queue with proper delays
const processQueue = async () => {
  if (isProcessing) return;
  isProcessing = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      try {
        await request();
      } catch (error) {
        console.error('Error processing queued request:', error);
      }
      // Add delay between requests
      await sleep(2000);
    }
  }

  isProcessing = false;
};

export const useAmazonProducts = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getAmazonProduct = async (searchTerm: string, priceRange: string): Promise<AmazonProduct | null> => {
    return new Promise((resolve, reject) => {
      const processRequest = async () => {
        try {
          const cacheKey = `${searchTerm}-${priceRange}`;
          
          // Check cache first
          const cached = getCachedProduct<AmazonProduct>(cacheKey);
          if (cached) {
            return resolve(cached);
          }

          console.log(`Attempting Amazon product request for: ${searchTerm} with price range: ${priceRange}`);
          
          // Use withRetry with increased delays between retries
          const product = await withRetry(
            async () => {
              const result = await searchWithFallback(searchTerm, priceRange);
              await sleep(2000); // Add delay between requests
              return result;
            },
            3, // Reduced max retries
            5000 // Increased base retry delay
          );
          
          if (product) {
            cacheProduct(cacheKey, product);
            resolve(product);
          } else {
            toast({
              title: "Product not found",
              description: "We'll try to find similar products for you",
              variant: "default",
            });
            resolve(null);
          }
        } catch (error: any) {
          console.error('Error getting Amazon product:', error);
          
          if (error.status === 429 || error.message?.includes('Rate limit exceeded')) {
            const retryAfter = error.retryAfter || 30;
            toast({
              title: "Too many requests",
              description: `Please wait ${retryAfter} seconds before trying again`,
              variant: "destructive",
            });
            
            reject(error);
          } else {
            toast({
              title: "Error fetching product",
              description: "We'll try to find alternative products for you",
              variant: "destructive",
            });
            resolve(null);
          }
        }
      };

      // Add request to queue and process
      requestQueue.push(processRequest);
      processQueue();
    });
  };

  return {
    getAmazonProduct,
    isLoading
  };
};