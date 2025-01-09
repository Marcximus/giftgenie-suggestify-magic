import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AmazonProduct } from '@/utils/amazon/types';
import { calculateBackoffDelay, sleep } from '@/utils/amazon/rateLimiter';
import { AMAZON_CONFIG } from '@/utils/amazon/config';

// Simple in-memory cache
const productCache = new Map<string, { data: AmazonProduct; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useAmazonProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const clearStaleCache = useCallback(() => {
    const now = Date.now();
    for (const [key, value] of productCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        productCache.delete(key);
      }
    }
  }, []);

  const getAmazonProduct = async (searchTerm: string, priceRange: string, retryCount = 0): Promise<AmazonProduct | null> => {
    try {
      const cacheKey = `${searchTerm}-${priceRange}`;
      clearStaleCache();

      // Check cache first
      const cached = productCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Cache hit for:', searchTerm);
        return cached.data;
      }

      console.log(`Attempting Amazon product request for: ${searchTerm} with price range: ${priceRange}`);
      const { data, error } = await supabase.functions.invoke('get-amazon-products', {
        body: { searchTerm, priceRange }
      });

      if (error) {
        console.error('Error in Amazon product request:', error);
        
        if (error.status === 429 && retryCount < AMAZON_CONFIG.MAX_RETRIES) {
          const delay = calculateBackoffDelay(retryCount);
          console.log(`Rate limited. Retrying in ${delay/1000} seconds...`);
          
          await sleep(delay);
          return getAmazonProduct(searchTerm, priceRange, retryCount + 1);
        }
        
        throw error;
      }

      // Ensure price is properly formatted
      if (data && typeof data.price === 'number') {
        data.price = parseFloat(data.price.toFixed(2));
      }

      // Cache the successful response
      if (data) {
        productCache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error) {
      console.error('Error getting Amazon product:', error);
      if (retryCount < AMAZON_CONFIG.MAX_RETRIES) {
        const delay = calculateBackoffDelay(retryCount);
        await sleep(delay);
        return getAmazonProduct(searchTerm, priceRange, retryCount + 1);
      }
      return null;
    }
  };

  return {
    getAmazonProduct,
    isLoading
  };
};