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
    if (!searchTerm?.trim()) {
      console.error('Search term is missing or empty');
      toast({
        title: "Invalid search term",
        description: "Please provide a valid search term",
        variant: "destructive",
      });
      return null;
    }

    try {
      setIsLoading(true);
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
        return product;
      }

      // If no product found, show a more user-friendly message
      toast({
        title: "Product not found",
        description: "We'll try to find similar products for you",
        variant: "default",
      });
      
      return null;

    } catch (error: any) {
      console.error('Error getting Amazon product:', error);
      
      // Handle different error types
      if (error.status === 429) {
        toast({
          title: "Too many requests",
          description: "Please wait a moment before trying again",
          variant: "destructive",
        });
      } else if (error.status !== 404) {
        toast({
          title: "Error fetching product",
          description: "We'll try to find alternative products for you",
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