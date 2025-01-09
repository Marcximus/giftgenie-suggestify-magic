import { useState } from 'react';
import { AmazonProduct } from '@/utils/amazon/types';
import { calculateBackoffDelay, sleep } from '@/utils/amazon/rateLimiter';
import { AMAZON_CONFIG } from '@/utils/amazon/config';
import { searchWithFallback } from '@/utils/amazon/searchUtils';
import { getCachedProduct, cacheProduct } from '@/utils/amazon/cacheUtils';
import { toast } from "@/components/ui/use-toast";

export const useAmazonProducts = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getAmazonProduct = async (searchTerm: string, priceRange: string, retryCount = 0): Promise<AmazonProduct | null> => {
    try {
      const cacheKey = `${searchTerm}-${priceRange}`;
      
      // Check cache first
      const cached = getCachedProduct(cacheKey);
      if (cached) {
        return cached;
      }

      console.log(`Attempting Amazon product request for: ${searchTerm} with price range: ${priceRange}`);
      
      const product = await searchWithFallback(searchTerm, priceRange);
      
      if (product) {
        cacheProduct(cacheKey, product);
      }
      
      return product;

    } catch (error: any) {
      console.error('Error getting Amazon product:', error);
      
      // Handle rate limiting
      if (error.status === 429 && retryCount < AMAZON_CONFIG.MAX_RETRIES) {
        const delay = calculateBackoffDelay(retryCount);
        console.log(`Rate limited. Retrying in ${delay/1000} seconds...`);
        await sleep(delay);
        return getAmazonProduct(searchTerm, priceRange, retryCount + 1);
      }

      // Don't show toast for 404 errors as they're expected when no products are found
      if (error.status !== 404) {
        toast({
          title: "Error fetching product",
          description: error.message,
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