import { useState } from 'react';
import { AmazonProduct } from '@/utils/amazon/types';
import { calculateBackoffDelay, sleep } from '@/utils/amazon/rateLimiter';
import { AMAZON_CONFIG } from '@/utils/amazon/config';
import { searchWithFallback } from '@/utils/amazon/searchUtils';
import { getCachedProduct, cacheProduct } from '@/utils/amazon/cacheUtils';
import { withRetry } from '@/utils/amazon/retryUtils';
import { toast } from "@/components/ui/use-toast";

// Rate limiting configuration - adjusted for increased concurrency
const RATE_LIMIT = {
  MAX_REQUESTS: 25, // Increased from 20 to 25
  WINDOW_MS: 60000, // 1 minute
  RETRY_AFTER: 45 // Reduced from 60 to 45 seconds for faster recovery
};

const requestLog: { timestamp: number }[] = [];

const isRateLimited = () => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.WINDOW_MS;
  
  // Clean up old requests
  const recentRequests = requestLog.filter(req => req.timestamp > windowStart);
  requestLog.length = 0;
  requestLog.push(...recentRequests);
  
  return recentRequests.length >= RATE_LIMIT.MAX_REQUESTS;
};

export const useAmazonProducts = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getAmazonProduct = async (searchTerm: string, priceRange: string): Promise<AmazonProduct | null> => {
    try {
      const cacheKey = `${searchTerm}-${priceRange}`;
      
      // Check cache first
      const cached = getCachedProduct<AmazonProduct>(cacheKey);
      if (cached) {
        return cached;
      }

      // Check rate limiting
      if (isRateLimited()) {
        console.log('Rate limit reached, waiting before retry');
        await sleep(RATE_LIMIT.RETRY_AFTER * 1000);
      }

      console.log(`Attempting Amazon product request for: ${searchTerm} with price range: ${priceRange}`);
      
      // Log this request
      requestLog.push({ timestamp: Date.now() });
      
      // Use withRetry with increased delays
      const product = await withRetry(
        () => searchWithFallback(searchTerm, priceRange),
        AMAZON_CONFIG.MAX_RETRIES,
        AMAZON_CONFIG.BASE_RETRY_DELAY * 2 // Doubled the base retry delay
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
      
      if (error.status === 429) {
        const retryAfter = error.retryAfter || RATE_LIMIT.RETRY_AFTER;
        toast({
          title: "Too many requests",
          description: `Please wait ${retryAfter} seconds before trying again`,
          variant: "destructive",
        });
        
        await sleep(retryAfter * 1000);
      } else if (error.status !== 404) {
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
