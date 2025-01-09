import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAmazonProducts } from './useAmazonProducts';

interface GiftSuggestion {
  title: string;
  description: string;
  priceRange: string;
  reason: string;
  amazon_asin?: string;
  amazon_url?: string;
  amazon_price?: number;
  amazon_image_url?: string;
  amazon_rating?: number;
  amazon_total_ratings?: number;
}

const BASE_RETRY_DELAY = 2000; // Start with 2 seconds
const MAX_RETRIES = 5;
const MAX_BACKOFF_DELAY = 30000; // Maximum delay of 30 seconds

// Queue for managing API requests
const requestQueue: Array<() => Promise<any>> = [];
let isProcessingQueue = false;

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
      await new Promise(resolve => setTimeout(resolve, BASE_RETRY_DELAY));
      processQueue();
    }
  }
};

export const useSuggestions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [lastQuery, setLastQuery] = useState('');
  const { toast } = useToast();
  const { getAmazonProduct } = useAmazonProducts();

  const generateSuggestions = async (query: string, append: boolean = false, retryCount: number = 0) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    if (!append) {
      setSuggestions([]);
    }

    const makeRequest = async () => {
      try {
        console.log('Attempting to generate suggestions:', { query, retryCount });
        const { data, error } = await supabase.functions.invoke('generate-gift-suggestions', {
          body: { prompt: query }
        });

        if (error) {
          console.error('Error from generate-gift-suggestions:', error);
          
          if (error.status === 429) {
            const delay = Math.min(BASE_RETRY_DELAY * Math.pow(2, retryCount), MAX_BACKOFF_DELAY);
            
            if (retryCount < MAX_RETRIES) {
              toast({
                title: "Please wait",
                description: `Retrying in ${Math.ceil(delay/1000)} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`,
                duration: delay
              });
              
              await new Promise(resolve => setTimeout(resolve, delay));
              return generateSuggestions(query, append, retryCount + 1);
            } else {
              toast({
                title: "Error",
                description: "Unable to get suggestions after multiple attempts. Please try again later.",
                variant: "destructive"
              });
              return;
            }
          }
          throw error;
        }

        if (!data?.suggestions || !Array.isArray(data.suggestions)) {
          throw new Error('Invalid response format');
        }

        // Process suggestions sequentially with queuing
        const enhancedSuggestions = [];
        for (const suggestion of data.suggestions) {
          try {
            const amazonProduct = await new Promise((resolve) => {
              const request = async () => {
                try {
                  const product = await getAmazonProduct(suggestion.title);
                  resolve(product);
                } catch (error) {
                  console.error('Error getting Amazon product:', error);
                  resolve(null);
                }
              };
              requestQueue.push(request);
              processQueue();
            });

            if (amazonProduct) {
              enhancedSuggestions.push({
                ...suggestion,
                title: amazonProduct.title || suggestion.title,
                description: amazonProduct.description || suggestion.description,
                priceRange: `${amazonProduct.currency} ${amazonProduct.price}`,
                amazon_asin: amazonProduct.asin,
                amazon_url: amazonProduct.asin ? `https://www.amazon.com/dp/${amazonProduct.asin}` : undefined,
                amazon_price: amazonProduct.price,
                amazon_image_url: amazonProduct.imageUrl,
                amazon_rating: amazonProduct.rating,
                amazon_total_ratings: amazonProduct.totalRatings
              });
            }
          } catch (error) {
            console.error('Error processing suggestion:', error);
            continue;
          }
        }

        setSuggestions(prev => append ? [...prev, ...enhancedSuggestions] : enhancedSuggestions);
        
      } catch (error) {
        console.error('Error getting suggestions:', error);
        toast({
          title: "Error",
          description: "Failed to get gift suggestions. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    await makeRequest();
  };

  const handleSearch = async (query: string) => {
    setLastQuery(query);
    await generateSuggestions(query);
  };

  const handleGenerateMore = async () => {
    if (lastQuery) {
      await generateSuggestions(lastQuery, true);
    }
  };

  const handleMoreLikeThis = async (title: string) => {
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .trim();
    
    const query = `Find me 8 gift suggestions similar to "${cleanTitle}". Focus on products that:
    1. Serve a similar purpose or function
    2. Are in a similar category
    3. Have similar features or characteristics
    4. Are in a comparable price range
    Please ensure each suggestion is distinct but closely related to the original item.`;
    
    setLastQuery(query);
    await generateSuggestions(query);
  };

  const handleStartOver = () => {
    setSuggestions([]);
    setLastQuery('');
    window.location.reload();
  };

  return {
    isLoading,
    suggestions,
    handleSearch,
    handleGenerateMore,
    handleMoreLikeThis,
    handleStartOver
  };
};