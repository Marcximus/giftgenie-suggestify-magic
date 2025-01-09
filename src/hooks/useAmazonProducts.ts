import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AmazonProduct } from '@/utils/amazon/types';
import { calculateBackoffDelay, sleep } from '@/utils/amazon/rateLimiter';
import { AMAZON_CONFIG } from '@/utils/amazon/config';

// Improved in-memory cache with LRU-like behavior
const MAX_CACHE_SIZE = 100;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const productCache = new Map<string, { data: AmazonProduct; timestamp: number }>();

export const useAmazonProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const clearStaleCache = useCallback(() => {
    const now = Date.now();
    let deletedCount = 0;
    
    // Remove stale entries and trim cache if too large
    for (const [key, value] of productCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION || productCache.size - deletedCount > MAX_CACHE_SIZE) {
        productCache.delete(key);
        deletedCount++;
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
      
      // Try with full search term first
      const response = await supabase.functions.invoke('get-amazon-products', {
        body: { searchTerm, priceRange }
      });

      if (response.error) {
        // Handle 404 (No products found) differently
        if (response.error.status === 404) {
          console.log('No products found for search term:', searchTerm);
          
          // Try with first 3 words if the search term has more than 3 words
          const words = searchTerm.split(' ');
          if (words.length > 3) {
            const simplifiedSearch = words.slice(0, 3).join(' ');
            console.log('Attempting simplified search with:', simplifiedSearch);
            
            const simplifiedResponse = await supabase.functions.invoke('get-amazon-products', {
              body: { searchTerm: simplifiedSearch, priceRange }
            });

            if (!simplifiedResponse.error) {
              return simplifiedResponse.data;
            }
          }
          
          // If both attempts fail, return null without showing an error toast
          return null;
        }

        // Handle rate limiting
        if (response.error.status === 429 && retryCount < AMAZON_CONFIG.MAX_RETRIES) {
          const delay = calculateBackoffDelay(retryCount);
          console.log(`Rate limited. Retrying in ${delay/1000} seconds...`);
          await sleep(delay);
          return getAmazonProduct(searchTerm, priceRange, retryCount + 1);
        }

        // For other errors, show a toast
        toast({
          title: "Error fetching product",
          description: response.error.message,
          variant: "destructive",
        });
        
        throw response.error;
      }

      // Cache successful responses
      if (response.data) {
        // Remove oldest entry if cache is full
        if (productCache.size >= MAX_CACHE_SIZE) {
          const oldestKey = productCache.keys().next().value;
          productCache.delete(oldestKey);
        }
        productCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
      }

      return response.data;
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