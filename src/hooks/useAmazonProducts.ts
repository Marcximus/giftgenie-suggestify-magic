import { useState } from 'react';
import { AmazonProduct } from '@/utils/amazon/types';
import { AMAZON_CONFIG } from '@/utils/amazon/config';
import { searchWithFallback } from '@/utils/amazon/searchUtils';
import { withRetry } from '@/utils/amazon/retryUtils';
import { toast } from "@/components/ui/use-toast";
import { isRateLimited, logRequest, getRemainingRequests } from '@/utils/amazon/rateLimiter';

export const useAmazonProducts = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getAmazonProduct = async (searchTerm: string, priceRange: string): Promise<AmazonProduct | null> => {
    try {
      const endpoint = 'amazon-product-search';
      if (isRateLimited(endpoint)) {
        const remainingRequests = getRemainingRequests(endpoint);
        console.log(`Rate limited. Remaining requests: ${remainingRequests}`);
        await new Promise(resolve => setTimeout(resolve, AMAZON_CONFIG.BASE_RETRY_DELAY));
      }

      logRequest(endpoint);
      
      const product = await withRetry(
        () => searchWithFallback(searchTerm, priceRange),
        AMAZON_CONFIG.MAX_RETRY_ATTEMPTS,
        AMAZON_CONFIG.BASE_RETRY_DELAY
      );
      
      return product || null;

    } catch (error: any) {
      console.error('Error getting Amazon product:', error);
      
      if (error.status === 429) {
        const retryAfter = error.retryAfter || AMAZON_CONFIG.BASE_RETRY_DELAY;
        toast({
          title: "Too many requests",
          description: "Please wait a moment before trying again",
          variant: "destructive",
        });
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      }
      
      return null;
    }
  };

  return {
    getAmazonProduct,
    isLoading
  };
};