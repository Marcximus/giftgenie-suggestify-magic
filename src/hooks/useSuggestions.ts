import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import debounce from "lodash/debounce";

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

  const generateSuggestionsMutation = useMutation({
    mutationFn: async ({ query, append }: { query: string, append: boolean }) => {
      const { data, error } = await supabase.functions.invoke('generate-gift-suggestions', {
        body: { prompt: query }
      });

      if (error) {
        if (error.status === 429) {
          throw new Error('Rate limit reached. Please wait a moment and try again.');
        }
        throw error;
      }

      if (!data?.suggestions || !Array.isArray(data.suggestions)) {
        throw new Error('Invalid response format from server');
      }

      return { suggestions: data.suggestions, append };
    },
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: ({ suggestions: newSuggestions, append }) => {
      setSuggestions(prev => append ? [...prev, ...newSuggestions] : newSuggestions);
      queryClient.setQueryData(['suggestions', lastQuery], newSuggestions);
      
      toast({
        title: append ? "More Ideas Generated" : "Success",
        description: append ? "Additional gift suggestions added!" : "Gift suggestions generated successfully!",
      });
    },
    onError: (error: Error) => {
      console.error('Error getting suggestions:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get gift suggestions. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      generateSuggestionsMutation.mutate({ query, append: false });
    }, 500),
    []
  );

  const handleSearch = async (query: string) => {
    setLastQuery(query);
    debouncedSearch(query);
  };

  const handleGenerateMore = async () => {
    if (lastQuery) {
      generateSuggestionsMutation.mutate({ query: lastQuery, append: true });
    }
  };

  const handleMoreLikeThis = async (title: string) => {
    const query = `Find me more gift suggestions similar to "${title}" with similar features and price range`;
    setLastQuery(query);
    generateSuggestionsMutation.mutate({ query, append: false });
  };

  const handleStartOver = () => {
    setSuggestions([]);
    setLastQuery('');
    queryClient.removeQueries({ queryKey: ['suggestions'] });
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