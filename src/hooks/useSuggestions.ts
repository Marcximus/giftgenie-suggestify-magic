import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOpenAISuggestions } from './useOpenAISuggestions';
import { useAmazonProductProcessing } from './useAmazonProductProcessing';
import { GiftSuggestion } from '@/types/suggestions';
import { debounce } from '@/utils/debounce';
import { supabase } from "@/integrations/supabase/client";

export const useSuggestions = () => {
  const [lastQuery, setLastQuery] = useState('');
  const { generateSuggestions } = useOpenAISuggestions();
  const { processSuggestions } = useAmazonProductProcessing();
  const queryClient = useQueryClient();

  const { data: suggestions = [], isPending: isLoading, mutate: fetchSuggestions } = useMutation({
    mutationFn: async (query: string) => {
      const startTime = performance.now();
      try {
        console.log('Fetching suggestions for query:', query);
        
        // Create a more detailed prompt for GPT
        const enhancedPrompt = `Generate 8 thoughtful and specific gift suggestions based on this request: "${query}"

IMPORTANT GUIDELINES:
- Each suggestion must be a specific product (e.g., "Sony WH-1000XM4 Wireless Headphones" instead of just "headphones")
- Consider any mentioned budget constraints
- Consider any mentioned age or gender preferences
- Include a mix of practical and creative gifts
- Ensure suggestions are appropriate for the context
- Each suggestion should be from a different product category

Return ONLY a JSON array of exactly 8 specific gift keywords.`;

        const newSuggestions = await generateSuggestions(enhancedPrompt);
        
        if (newSuggestions) {
          console.log('Processing suggestions in parallel');
          const results = await processSuggestions(newSuggestions);
          
          await supabase.from('api_metrics').insert({
            endpoint: 'generate-suggestions',
            duration_ms: Math.round(performance.now() - startTime),
            status: 'success'
          });
          
          return results;
        }
        return [];
      } catch (error) {
        console.error('Error in suggestion mutation:', error);
        
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
      queryClient.setQueryData(['suggestions'], data);
    }
  });

  const debouncedSearch = debounce(async (query: string) => {
    setLastQuery(query);
    await fetchSuggestions(query);
  }, 300, { leading: true, trailing: true });

  const handleGenerateMore = async () => {
    if (lastQuery) {
      await fetchSuggestions(lastQuery);
    }
  };

  const handleMoreLikeThis = async (title: string) => {
    const contextualPrompt = `Find me 8 gift suggestions that are very similar to "${title}" in terms of type, style, and purpose. Focus on products that serve a similar function or appeal to people who would like "${title}".

IMPORTANT GUIDELINES:
- Suggest products that are DIRECTLY related to or complement "${title}"
- Include variations of similar products with different features
- Include alternative brands offering similar functionality
- Focus on the same product category and use case
- Maintain similar quality level and target audience`;
    
    console.log('Generated "More like this" prompt:', contextualPrompt);
    
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