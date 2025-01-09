import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GiftSuggestion {
  title: string;
  description: string;
  priceRange: string;
  reason: string;
}

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
const RETRY_DELAY = 30000; // 30 seconds default retry delay

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
      // Add delay before processing next request
      await new Promise(resolve => setTimeout(resolve, 1000));
      processQueue();
    }
  }
};

export const useSuggestions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [lastQuery, setLastQuery] = useState('');
  const { toast } = useToast();

  const getAmazonProduct = async (suggestion: GiftSuggestion): Promise<AmazonProduct> => {
    try {
      return new Promise((resolve, reject) => {
        const makeRequest = async () => {
          try {
            const { data, error } = await supabase.functions.invoke('get-amazon-products', {
              body: { searchTerm: suggestion.title }
            });

            if (error) {
              if (error.status === 429) {
                const retryAfter = parseInt(error.message.match(/\d+/)?.[0] || '30');
                toast({
                  title: "Rate limit reached",
                  description: `Please wait ${retryAfter} seconds before trying again.`,
                  variant: "destructive"
                });
                // Re-queue the request after delay
                setTimeout(() => {
                  requestQueue.push(makeRequest);
                  processQueue();
                }, retryAfter * 1000);
                return;
              }
              throw error;
            }

            resolve(data);
          } catch (error) {
            console.error('Error in Amazon product request:', error);
            // Return fallback data on error
            resolve({
              title: suggestion.title,
              description: suggestion.description,
              price: parseFloat(suggestion.priceRange.replace(/[^0-9.-]+/g, '')),
              currency: 'USD',
              imageUrl: '',
              asin: ''
            });
          }
        };

        // Add request to queue
        requestQueue.push(makeRequest);
        processQueue();
      });
    } catch (error) {
      console.error('Error getting Amazon product:', error);
      return {
        title: suggestion.title,
        description: suggestion.description,
        price: parseFloat(suggestion.priceRange.replace(/[^0-9.-]+/g, '')),
        currency: 'USD',
        imageUrl: '',
        asin: ''
      };
    }
  };

  const generateSuggestions = async (query: string, append: boolean = false) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    if (!append) {
      setSuggestions([]);
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-gift-suggestions', {
        body: { prompt: query }
      });

      if (error) {
        if (error.status === 429) {
          toast({
            title: "Please wait",
            description: "Our service is experiencing high demand. Please try again in a moment.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      if (!data?.suggestions || !Array.isArray(data.suggestions)) {
        throw new Error('Invalid response format');
      }

      // Process suggestions sequentially to avoid rate limits
      const enhancedSuggestions = [];
      for (const suggestion of data.suggestions) {
        const amazonProduct = await getAmazonProduct(suggestion);
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