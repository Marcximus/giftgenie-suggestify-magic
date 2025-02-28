
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useDeepSeekSuggestions from '../useDeepSeekSuggestions';
import { useAmazonProductProcessing } from '../useAmazonProductProcessing';
import { GiftSuggestion } from '@/types/suggestions';
import { debounce } from '@/utils/debounce';
import { supabase } from "@/integrations/supabase/client";
import { useSearchAnalytics } from './useSearchAnalytics';
import { useSuggestionContext } from './useSuggestionContext';
import { useEdgePrewarming } from './useEdgePrewarming';

export const useSuggestions = () => {
  const [lastQuery, setLastQuery] = useState('');
  const { generateSuggestions } = useDeepSeekSuggestions();
  const { processSuggestions } = useAmazonProductProcessing();
  const queryClient = useQueryClient();
  const { trackSearchAnalytics } = useSearchAnalytics();
  const { generateMoreLikeThisPrompt } = useSuggestionContext();
  
  // Initialize Edge Function pre-warming
  useEdgePrewarming();

  const { data: suggestions = [], isPending: isLoading, mutate: fetchSuggestions } = useMutation({
    mutationFn: async (query: string) => {
      const startTime = performance.now();
      try {
        console.log('Starting suggestion generation for query:', query);
        const response = await generateSuggestions(query);
        
        if (!response || !response.suggestions) {
          console.error('Invalid suggestions received:', response);
          throw new Error('Failed to generate valid suggestions');
        }

        const { suggestions: newSuggestions, priceRange } = response;
        console.log('Generated suggestions:', newSuggestions, 'Price range:', priceRange);
        
        if (newSuggestions.length > 0) {
          console.log('Processing suggestions with Amazon data');
          
          // Start progressive processing of suggestions
          const results = await processSuggestions(newSuggestions, priceRange);
          
          // Track search analytics after successful processing
          await trackSearchAnalytics(query, results);
          
          // Log metrics for successful processing
          await supabase.from('api_metrics').insert({
            endpoint: 'generate-suggestions',
            duration_ms: Math.round(performance.now() - startTime),
            status: 'success'
          });
          
          console.log('Processed suggestions with Amazon data:', results);
          return results;
        }

        console.warn('No suggestions generated');
        return [];
      } catch (error) {
        console.error('Error in suggestion mutation:', error);
        
        // Log metrics for failed processing
        await supabase.from('api_metrics').insert({
          endpoint: 'generate-suggestions',
          duration_ms: Math.round(performance.now() - startTime),
          status: 'error',
          error_message: error.message
        });
        
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Successfully updated suggestions cache:', data);
      queryClient.setQueryData(['suggestions'], data);
    }
  });

  const debouncedSearch = debounce(async (query: string) => {
    console.log('Debounced search triggered with query:', query);
    setLastQuery(query);
    await fetchSuggestions(query);
  }, 300, { leading: true, trailing: true });

  const handleSearch = async (query: string) => {
    console.log('Search initiated with query:', query);
    setLastQuery(query);
    await debouncedSearch(query);
  };

  const handleGenerateMore = async () => {
    if (lastQuery) {
      console.log('Generating more suggestions for query:', lastQuery);
      await fetchSuggestions(lastQuery);
    }
  };

  const handleMoreLikeThis = async (title: string) => {
    console.log('Generating more suggestions like:', title);
    const contextualPrompt = generateMoreLikeThisPrompt(title, lastQuery);
    
    setLastQuery(contextualPrompt);
    await fetchSuggestions(contextualPrompt);
  };

  const handleStartOver = () => {
    window.location.reload();
  };

  return {
    isLoading,
    suggestions,
    handleSearch: debouncedSearch,
    handleGenerateMore,
    handleMoreLikeThis,
    handleStartOver
  };
};
