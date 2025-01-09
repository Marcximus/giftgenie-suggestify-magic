import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AmazonProduct {
  title: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  rating?: number;
  totalRatings?: number;
  asin: string;
}

const MAX_RETRIES = 1;
const BASE_DELAY = 100; // Reduced from 250ms to 100ms

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
        
        if (error.status === 429 && retryCount < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(1.1, retryCount); // Reduced exponential factor from 1.25 to 1.1
          console.log(`Rate limited. Retrying in ${delay/1000} seconds...`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return getAmazonProduct(searchTerm, retryCount + 1);
        }
        
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting Amazon product:', error);
      if (retryCount < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(1.1, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
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