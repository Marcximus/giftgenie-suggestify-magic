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

  const trySearchWithTerm = async (searchTerm: string, priceRange: string): Promise<AmazonProduct | null> => {
    console.log('Attempting search with term:', searchTerm);
    const response = await supabase.functions.invoke('get-amazon-products', {
      body: { searchTerm, priceRange }
    });

    if (!response.error) {
      return response.data;
    }

    if (response.error.status !== 404) {
      throw response.error;
    }

    return null;
  };

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
      let product = await trySearchWithTerm(searchTerm, priceRange);
      
      // If no product found and search term has more than 3 words, try with first 3 words
      if (!product) {
        const words = searchTerm.split(' ');
        if (words.length > 3) {
          const simplifiedSearch = words.slice(0, 3).join(' ');
          console.log('No products found, attempting simplified search with:', simplifiedSearch);
          product = await trySearchWithTerm(simplifiedSearch, priceRange);
        }
      }

      // If still no product found, try with just the first two words
      if (!product) {
        const words = searchTerm.split(' ');
        if (words.length > 2) {
          const briefSearch = words.slice(0, 2).join(' ');
          console.log('Still no products found, attempting brief search with:', briefSearch);
          product = await trySearchWithTerm(briefSearch, priceRange);
        }
      }

      // If no product found after all attempts, show a toast
      if (!product) {
        toast({
          title: "No products found",
          description: "Try searching with a more general term",
          variant: "destructive",
        });
        return null;
      }

      // Cache successful response
      productCache.set(cacheKey, { data: product, timestamp: Date.now() });
      return product;

    } catch (error) {
      console.error('Error getting Amazon product:', error);
      
      // Handle rate limiting
      if (error.status === 429 && retryCount < AMAZON_CONFIG.MAX_RETRIES) {
        const delay = calculateBackoffDelay(retryCount);
        console.log(`Rate limited. Retrying in ${delay/1000} seconds...`);
        await sleep(delay);
        return getAmazonProduct(searchTerm, priceRange, retryCount + 1);
      }

      // For other errors, show a toast
      toast({
        title: "Error fetching product",
        description: error.message,
        variant: "destructive",
      });
      
      return null;
    }
  };

  return {
    getAmazonProduct,
    isLoading
  };
};