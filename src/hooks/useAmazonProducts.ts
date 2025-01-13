import { useState } from 'react';
import { AmazonProduct } from '@/utils/amazon/types';
import { calculateBackoffDelay, sleep } from '@/utils/amazon/rateLimiter';
import { AMAZON_CONFIG } from '@/utils/amazon/config';
import { searchWithFallback } from '@/utils/amazon/searchUtils';
import { getCachedProduct, cacheProduct } from '@/utils/amazon/cacheUtils';
import { withRetry } from '@/utils/amazon/retryUtils';
import { toast } from "@/components/ui/use-toast";

// Track request timestamps for rate limiting
const requestTimestamps: number[] = [];
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

export const useAmazonProducts = () => {
  const [isLoading, setIsLoading] = useState(false);

  const checkRateLimit = async () => {
    const now = Date.now();
    // Remove timestamps older than the window
    while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_WINDOW) {
      requestTimestamps.shift();
    }
    
    if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      const oldestRequest = requestTimestamps[0];
      const waitTime = (oldestRequest + RATE_LIMIT_WINDOW) - now;
      if (waitTime > 0) {
        throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
      }
    }
    
    requestTimestamps.push(now);
  };

  const getAmazonProduct = async (searchTerm: string, priceRange: string): Promise<AmazonProduct | null> => {
    try {
      const cacheKey = `${searchTerm}-${priceRange}`;
      
      // Check cache first
      const cached = getCachedProduct<AmazonProduct>(cacheKey);
      if (cached) {
        return cached;
      }

      await checkRateLimit();
      console.log(`Attempting Amazon product request for: ${searchTerm} with price range: ${priceRange}`);
      
      // Use withRetry with increased delays between retries
      const product = await withRetry(
        async () => {
          const result = await searchWithFallback(searchTerm, priceRange);
          await sleep(1000); // Add delay between requests
          return result;
        },
        AMAZON_CONFIG.MAX_RETRIES,
        AMAZON_CONFIG.BASE_RETRY_DELAY
      );
      
      if (product) {
        cacheProduct(cacheKey, product);
        return product;
      }

      toast({
        title: "Product not found",
        description: "We'll try to find similar products for you",
        variant: "default",
      });
      
      return null;

    } catch (error: any) {
      console.error('Error getting Amazon product:', error);
      
      if (error.status === 429 || error.message?.includes('Rate limit exceeded')) {
        const retryAfter = error.retryAfter || 30;
        toast({
          title: "Too many requests",
          description: `Please wait ${retryAfter} seconds before trying again`,
          variant: "destructive",
        });
        
        // Add an artificial delay before retrying
        await sleep(retryAfter * 1000);
      } else {
        toast({
          title: "Error fetching product",
          description: "We'll try to find alternative products for you",
          variant: "destructive",
        });
      }
      
      return null;
    }
  };

  return {
    getAmazonProduct,
    isLoading
  };
};