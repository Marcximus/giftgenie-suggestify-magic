import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';

interface GiftSuggestion {
  title: string;
  description: string;
  priceRange: string;
  reason: string;
}

export const useSuggestions = () => {
  const [lastQuery, setLastQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const debouncedGenerateSuggestions = debounce(async (query: string) => {
    if (!query.trim()) {
      return [];
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
          return [];
        }
        throw error;
      }

      if (!data?.suggestions || !Array.isArray(data.suggestions)) {
        console.error('Invalid response format:', data);
        return [];
      }

      return data.suggestions;
      
    } catch (error) {
      console.error('Error getting suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to get gift suggestions. Please try again.",
        variant: "destructive"
      });
      return [];
    }
  }, 300);

  const { data: suggestions = [], isLoading, refetch } = useQuery({
    queryKey: ['suggestions', lastQuery],
    queryFn: () => debouncedGenerateSuggestions(lastQuery),
    enabled: !!lastQuery,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setLastQuery(query);
    // Prefetch related queries
    const similarQuery = query.split(' ').slice(0, 3).join(' ');
    queryClient.prefetchQuery({
      queryKey: ['suggestions', similarQuery],
      queryFn: () => debouncedGenerateSuggestions(similarQuery),
    });
  };

  const handleGenerateMore = async () => {
    if (lastQuery) {
      const moreQuery = `${lastQuery} (exclude previous suggestions)`;
      const newSuggestions = await debouncedGenerateSuggestions(moreQuery);
      if (newSuggestions) {
        queryClient.setQueryData(['suggestions', lastQuery], 
          (oldData: GiftSuggestion[] = []) => [...oldData, ...newSuggestions]
        );
      }
    }
  };

  const handleMoreLikeThis = async (title: string) => {
    const query = lastQuery 
      ? `Based on the search "${lastQuery}", find me more gift suggestions similar to "${title}". Focus on items that share similar features, price range, and purpose.`
      : `Find me more gift suggestions similar to "${title}". Focus on items that serve a similar purpose and are in a similar price range.`;
    
    setLastQuery(query);
  };

  const handleStartOver = () => {
    setLastQuery('');
    queryClient.clear();
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