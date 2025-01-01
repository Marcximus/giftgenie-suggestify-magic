import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
    const query = lastQuery 
      ? `Based on the search "${lastQuery}", find me more gift suggestions similar to "${title}". Focus on items that share similar features, price range, and purpose.`
      : `Find me more gift suggestions similar to "${title}". Focus on items that serve a similar purpose and are in a similar price range.`;
    
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