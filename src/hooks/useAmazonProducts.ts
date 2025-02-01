import { useState } from 'react';
import { AmazonProduct } from '@/utils/amazon/types';
import { AMAZON_CONFIG } from '@/utils/amazon/config';
import { searchWithFallback } from '@/utils/amazon/searchUtils';
import { withRetry } from '@/utils/amazon/retryUtils';
import { toast } from "@/components/ui/use-toast";

const RATE_LIMIT = {
  MAX_REQUESTS: 25,
  WINDOW_MS: 60000,
  RETRY_AFTER: 30
};

const requestLog: { timestamp: number }[] = [];

const isRateLimited = () => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.WINDOW_MS;
  requestLog.splice(0, requestLog.findIndex(req => req.timestamp > windowStart));
  return requestLog.length >= RATE_LIMIT.MAX_REQUESTS;
};

export const useAmazonProducts = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getAmazonProduct = async (searchTerm: string, priceRange: string): Promise<AmazonProduct | null> => {
    try {
      setIsLoading(true);
      console.log('Starting Amazon product search:', { searchTerm, priceRange });

      if (isRateLimited()) {
        console.log('Rate limited, waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.RETRY_AFTER * 1000));
      }

      requestLog.push({ timestamp: Date.now() });
      
      const product = await withRetry(
        async () => {
          const result = await searchWithFallback(searchTerm, priceRange);
          console.log('Search result:', result);
          return result;
        },
        3,
        1000
      );
      
      if (!product) {
        console.log('No product found for search term:', searchTerm);
        toast({
          title: "No product found",
          description: "We couldn't find a matching product. Please try a different search.",
          variant: "destructive",
        });
      }

      return product || null;

    } catch (error: any) {
      console.error('Error getting Amazon product:', error);
      
      if (error.status === 429) {
        const retryAfter = error.retryAfter || RATE_LIMIT.RETRY_AFTER;
        toast({
          title: "Too many requests",
          description: "Please wait a moment before trying again",
          variant: "destructive",
        });
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      } else {
        toast({
          title: "Error fetching product",
          description: "There was an error fetching the product. Please try again.",
          variant: "destructive",
        });
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getAmazonProduct,
    isLoading
  };
};