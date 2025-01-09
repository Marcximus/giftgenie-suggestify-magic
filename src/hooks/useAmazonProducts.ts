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

// Queue for managing Amazon API requests
const requestQueue: Array<() => Promise<any>> = [];
let isProcessingQueue = false;
const MAX_RETRIES = 3;
const BASE_DELAY = 2000; // 2 seconds

const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  try {
    const request = requestQueue.shift();
    if (request) {
      await request();
    }
  } finally {
    isProcessingQueue = false;
    if (requestQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      processQueue();
    }
  }
};

export const useAmazonProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getAmazonProduct = async (searchTerm: string, retryCount = 0): Promise<AmazonProduct> => {
    try {
      return new Promise((resolve, reject) => {
        const makeRequest = async () => {
          try {
            console.log(`Attempting Amazon product request for: ${searchTerm}`);
            const { data, error } = await supabase.functions.invoke('get-amazon-products', {
              body: { searchTerm }
            });

            if (error) {
              console.error('Error in Amazon product request:', error);
              
              if (error.status === 429) {
                const retryAfter = parseInt(error.message.match(/\d+/)?.[0] || '30');
                console.log(`Rate limited. Retry after: ${retryAfter} seconds`);
                
                if (retryCount < MAX_RETRIES) {
                  const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), 30000);
                  toast({
                    title: "Please wait",
                    description: `Retrying in ${Math.ceil(delay/1000)} seconds...`,
                    variant: "default"
                  });
                  
                  setTimeout(() => {
                    requestQueue.push(() => makeRequest());
                    processQueue();
                  }, delay);
                  return;
                }
              }
              
              // Return fallback data after max retries or other errors
              resolve({
                title: searchTerm,
                description: "Product information temporarily unavailable",
                price: 0,
                currency: 'USD',
                imageUrl: '',
                asin: ''
              });
              return;
            }

            resolve(data);
          } catch (error) {
            console.error('Error in Amazon product request:', error);
            resolve({
              title: searchTerm,
              description: "Product information temporarily unavailable",
              price: 0,
              currency: 'USD',
              imageUrl: '',
              asin: ''
            });
          }
        };

        requestQueue.push(makeRequest);
        processQueue();
      });
    } catch (error) {
      console.error('Error getting Amazon product:', error);
      return {
        title: searchTerm,
        description: "Product information temporarily unavailable",
        price: 0,
        currency: 'USD',
        imageUrl: '',
        asin: ''
      };
    }
  };

  return {
    getAmazonProduct,
    isLoading
  };
};