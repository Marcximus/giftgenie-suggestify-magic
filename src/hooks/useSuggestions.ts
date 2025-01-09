import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { AMAZON_CONFIG } from '@/utils/amazon/config';

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

export const useSuggestions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [lastQuery, setLastQuery] = useState('');
  const { toast } = useToast();
  const { getAmazonProduct } = useAmazonProducts();
  const { processBatch } = useBatchProcessor<GiftSuggestion, GiftSuggestion>();

  const processGiftSuggestion = async (suggestion: GiftSuggestion): Promise<GiftSuggestion> => {
    try {
      console.log('Processing suggestion:', suggestion.title);
      const amazonProduct = await getAmazonProduct(suggestion.title, suggestion.priceRange);
      
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
      console.error('Error processing suggestion:', error);
      return suggestion;
    }
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

      const processedSuggestions = await processBatch(data.suggestions, {
        processFn: processGiftSuggestion,
        onError: (error, suggestion) => {
          console.error('Error processing suggestion:', suggestion.title, error);
          return suggestion;
        }
      });

      setSuggestions(prev => append ? [...prev, ...processedSuggestions] : processedSuggestions);

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
    // Extract gender context from the last query
    const isMale = lastQuery.toLowerCase().includes('brother') || 
                  lastQuery.toLowerCase().includes('father') || 
                  lastQuery.toLowerCase().includes('husband') || 
                  lastQuery.toLowerCase().includes('boyfriend') || 
                  lastQuery.toLowerCase().includes('son') || 
                  lastQuery.toLowerCase().includes('grandpa');

    const isFemale = lastQuery.toLowerCase().includes('sister') || 
                    lastQuery.toLowerCase().includes('mother') || 
                    lastQuery.toLowerCase().includes('wife') || 
                    lastQuery.toLowerCase().includes('girlfriend') || 
                    lastQuery.toLowerCase().includes('daughter') || 
                    lastQuery.toLowerCase().includes('grandma');

    const genderContext = isMale ? 'male' : isFemale ? 'female' : '';
    const genderInstruction = genderContext ? 
      `IMPORTANT: Only suggest gifts appropriate for ${genderContext} recipients. Do not include items specifically designed for ${isMale ? 'women' : 'men'}.` : '';
    
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .trim();
    
    const query = `Find me 8 gift suggestions similar to "${cleanTitle}". Focus on products that:
    1. Serve a similar purpose or function
    2. Are in a similar category
    3. Have similar features or characteristics
    4. Are in a comparable price range
    ${genderInstruction}
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