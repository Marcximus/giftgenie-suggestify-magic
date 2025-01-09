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

export const useSuggestions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [lastQuery, setLastQuery] = useState('');
  const { toast } = useToast();

  const getAmazonProduct = async (suggestion: GiftSuggestion): Promise<AmazonProduct> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-amazon-products', {
        body: { searchTerm: suggestion.title }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching Amazon product:', error);
      // Return original suggestion data if Amazon API fails
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

      // Enhance suggestions with Amazon product data
      const enhancedSuggestions = await Promise.all(
        data.suggestions.map(async (suggestion) => {
          const amazonProduct = await getAmazonProduct(suggestion);
          return {
            ...suggestion,
            title: amazonProduct.title || suggestion.title,
            description: amazonProduct.description || suggestion.description,
            priceRange: `${amazonProduct.currency} ${amazonProduct.price}`,
            amazon_asin: amazonProduct.asin,
            amazon_url: `https://www.amazon.com/dp/${amazonProduct.asin}`,
            amazon_price: amazonProduct.price,
            amazon_image_url: amazonProduct.imageUrl,
            amazon_rating: amazonProduct.rating,
            amazon_total_ratings: amazonProduct.totalRatings
          };
        })
      );

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
    // Extract key features from the title
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .trim();
    
    // Create a more focused query based on the product title
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
    // Trigger a window reload to ensure all components are reset
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