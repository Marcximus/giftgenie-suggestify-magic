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

const MAX_CONCURRENT_REQUESTS = 12; // Increased from 8 to 12
const STAGGER_DELAY = 5; // Reduced from 10ms to 5ms
const MAX_RETRIES = 1;
const BASE_RETRY_DELAY = 250; // Reduced from 500ms to 250ms
const MAX_BACKOFF_DELAY = 1000; // Reduced from 2000ms to 1000ms

export const useSuggestions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [lastQuery, setLastQuery] = useState('');
  const { toast } = useToast();
  const { getAmazonProduct } = useAmazonProducts();

  const processBatch = async (items: any[], currentRetry = 0) => {
    console.log(`Processing batch of ${items.length} items`);
    
    // Process items in parallel with minimal stagger
    const results = await Promise.all(
      items.map(async (suggestion, index) => {
        // Minimal stagger to prevent exact simultaneous requests
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, STAGGER_DELAY));
        }
        
        try {
          console.log('Fetching Amazon product for:', suggestion.title);
          const amazonProduct = await getAmazonProduct(suggestion.title);
          
          if (amazonProduct && amazonProduct.asin) {
            return {
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
            };
          }
          return suggestion;
        } catch (error) {
          console.error('Error processing product:', error);
          if (error.status === 429 && currentRetry < MAX_RETRIES) {
            const delay = Math.min(BASE_RETRY_DELAY * Math.pow(1.1, currentRetry), MAX_BACKOFF_DELAY);
            await new Promise(resolve => setTimeout(resolve, delay));
            return processBatch([suggestion], currentRetry + 1);
          }
          return suggestion;
        }
      })
    );

    return results.filter(Boolean);
  };

  const generateSuggestions = async (query: string, append: boolean = false) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    if (!append) {
      setSuggestions([]);
    }

    try {
      console.log('Generating suggestions for query:', query);
      const { data, error } = await supabase.functions.invoke('generate-gift-suggestions', {
        body: { prompt: query }
      });

      if (error) {
        console.error('Error from generate-gift-suggestions:', error);
        throw error;
      }

      if (!data?.suggestions || !Array.isArray(data.suggestions)) {
        throw new Error('Invalid response format');
      }

      // Process all suggestions in parallel with batching
      const batchSize = MAX_CONCURRENT_REQUESTS;
      const batches = [];
      for (let i = 0; i < data.suggestions.length; i += batchSize) {
        batches.push(data.suggestions.slice(i, i + batchSize));
      }

      // Process batches concurrently
      const batchResults = await Promise.all(
        batches.map(batch => processBatch(batch))
      );

      const allResults = batchResults.flat();
      setSuggestions(prev => append ? [...prev, ...allResults] : allResults);

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