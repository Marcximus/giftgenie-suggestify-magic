import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AmazonProduct } from '@/utils/amazon/types';
import { calculateBackoffDelay, sleep } from '@/utils/amazon/rateLimiter';
import { AMAZON_CONFIG } from '@/utils/amazon/config';

export const useAmazonProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getAmazonProduct = async (searchTerm: string, retryCount = 0): Promise<AmazonProduct | null> => {
    try {
      console.log(`Attempting Amazon product request for: ${searchTerm}`);
      const { data, error } = await supabase.functions.invoke('get-amazon-products', {
        body: { searchTerm }
      });

      if (error) {
        console.error('Error in Amazon product request:', error);
        
        if (error.status === 429 && retryCount < AMAZON_CONFIG.MAX_RETRIES) {
          const delay = calculateBackoffDelay(retryCount);
          console.log(`Rate limited. Retrying in ${delay/1000} seconds...`);
          
          await sleep(delay);
          return getAmazonProduct(searchTerm, retryCount + 1);
        }
        
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting Amazon product:', error);
      if (retryCount < AMAZON_CONFIG.MAX_RETRIES) {
        const delay = calculateBackoffDelay(retryCount);
        await sleep(delay);
        return getAmazonProduct(searchTerm, retryCount + 1);
      }
      return null;
    }
  };

  return {
    getAmazonProduct,
    isLoading
  };
};