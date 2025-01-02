import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface GiftSuggestion {
  title: string;
  description: string;
  priceRange: string;
  reason: string;
}

export const useSuggestions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [lastQuery, setLastQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Function to generate a cache key based on the query
  const getCacheKey = (query: string) => {
    return ['suggestions', query.toLowerCase().trim()];
  };

  const generateSuggestions = async (query: string, append: boolean = false) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    if (!append) {
      setSuggestions([]);
    }

    try {
      // Check cache first
      const cacheKey = getCacheKey(query);
      const cachedData = queryClient.getQueryData(cacheKey);
      
      if (cachedData) {
        console.log('Using cached suggestions');
        setSuggestions(prev => append ? [...prev, ...(cachedData as GiftSuggestion[])] : (cachedData as GiftSuggestion[]));
        setIsLoading(false);
        return;
      }

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

      // Cache the results
      queryClient.setQueryData(cacheKey, data.suggestions);

      setSuggestions(prev => append ? [...prev, ...data.suggestions] : data.suggestions);
      
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
    // Clear all suggestion caches when starting over
    queryClient.removeQueries({ queryKey: ['suggestions'] });
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