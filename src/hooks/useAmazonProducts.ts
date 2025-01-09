import { useState } from 'react';
import { AmazonProduct } from '@/utils/amazon/types';
import { calculateBackoffDelay, sleep } from '@/utils/amazon/rateLimiter';
import { AMAZON_CONFIG } from '@/utils/amazon/config';
import { searchWithFallback } from '@/utils/amazon/searchUtils';
import { getCachedProduct, cacheProduct, withRetry } from '@/utils/amazon/cacheUtils';
import { toast } from "@/components/ui/use-toast";

export const useAmazonProducts = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getAmazonProduct = async (searchTerm: string, priceRange: string): Promise<AmazonProduct | null> => {
    try {
      const cacheKey = `${searchTerm}-${priceRange}`;
      
      // Check cache first
      const cached = getCachedProduct(cacheKey);
      if (cached) {
        return cached;
      }

      console.log(`Attempting Amazon product request for: ${searchTerm} with price range: ${priceRange}`);
      
      // Use withRetry for the product search
      const product = await withRetry(
        () => searchWithFallback(searchTerm, priceRange),
        AMAZON_CONFIG.MAX_RETRIES
      );
      
      if (product) {
        cacheProduct(cacheKey, product);
      }
      
      return product;

    } catch (error: any) {
      console.error('Error getting Amazon product:', error);
      
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