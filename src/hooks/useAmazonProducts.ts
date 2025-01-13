import { useState } from 'react';
import { AmazonProduct } from '@/utils/amazon/types';
import { calculateBackoffDelay, sleep } from '@/utils/amazon/rateLimiter';
import { AMAZON_CONFIG } from '@/utils/amazon/config';
import { searchWithFallback } from '@/utils/amazon/searchUtils';
import { getCachedProduct, cacheProduct } from '@/utils/amazon/cacheUtils';
import { withRetry } from '@/utils/amazon/retryUtils';
import { toast } from "@/components/ui/use-toast";

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

      console.log(`Attempting Amazon product request for: ${searchTerm} with price range: ${priceRange}`);
      
      // Use withRetry for the product search with increased delays
      const product = await withRetry(
        () => searchWithFallback(searchTerm, priceRange),
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
      
      if (error.status === 429) {
        // Handle rate limiting with a more informative message
        const retryAfter = error.retryAfter || 30;
        toast({
          title: "Too many requests",
          description: `Please wait ${retryAfter} seconds before trying again`,
          variant: "destructive",
        });
        
        // Add an artificial delay before retrying
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