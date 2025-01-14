import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useOpenAISuggestions } from './useOpenAISuggestions';
import { useAmazonProductProcessing } from './useAmazonProductProcessing';
import { GiftSuggestion } from '@/types/suggestions';
import { debounce } from '@/utils/debounce';
import { supabase } from "@/integrations/supabase/client";

export const useSuggestions = () => {
  const [lastQuery, setLastQuery] = useState('');
  const { generateSuggestions } = useOpenAISuggestions();
  const { processSuggestions } = useAmazonProductProcessing();

  const { data: suggestions = [], isPending: isLoading, mutate: fetchSuggestions } = useMutation({
    mutationFn: async (query: string) => {
      const startTime = performance.now();
      try {
        console.log('Fetching suggestions for query:', query);
        const newSuggestions = await generateSuggestions(query);
        
        if (newSuggestions) {
          console.log('Processing suggestions in parallel');
          const results = await processSuggestions(newSuggestions);
          
          // Log metrics for successful processing
          await supabase.from('api_metrics').insert({
            endpoint: 'generate-suggestions',
            duration_ms: Math.round(performance.now() - startTime),
            status: 'success',
            cache_hit: false
          });
          
          return results;
        }
        return [];
      } catch (error) {
        console.error('Error in suggestion mutation:', error);
        
        // Log metrics for failed processing
        await supabase.from('api_metrics').insert({
          endpoint: 'generate-suggestions',
          duration_ms: Math.round(performance.now() - startTime),
          status: 'error',
          error_message: error.message,
          cache_hit: false
        });
        
        throw error;
      }
    },
    onSuccess: (data) => {
      // Update the suggestions cache with the enriched data
      queryClient.setQueryData(['suggestions'], data);
    }
  });

  // Optimized debounce settings
  const debouncedSearch = debounce(async (query: string) => {
    setLastQuery(query);
    await fetchSuggestions(query);
  }, 300, { leading: true, trailing: true });

  const handleSearch = async (query: string) => {
    setLastQuery(query);
    await debouncedSearch(query);
  };

  const handleGenerateMore = async () => {
    if (lastQuery) {
      await fetchSuggestions(lastQuery);
    }
  };

  const handleMoreLikeThis = async (title: string) => {
    const query = lastQuery.toLowerCase();
    
    // Extract context from the last query
    const isMale = query.includes('brother') || 
                  query.includes('father') || 
                  query.includes('husband') || 
                  query.includes('boyfriend') || 
                  query.includes('son') || 
                  query.includes('grandpa');

    const isFemale = query.includes('sister') || 
                    query.includes('mother') || 
                    query.includes('wife') || 
                    query.includes('girlfriend') || 
                    query.includes('daughter') || 
                    query.includes('grandma');

    const ageMatch = query.match(/(\d+)(?:\s*-\s*\d+)?\s*years?\s*old/i);
    const ageContext = ageMatch ? `for ${ageMatch[0]}` : '';

    const budgetMatch = query.match(/budget:\s*(\$?\d+(?:\s*-\s*\$?\d+)?)/i) || 
                       query.match(/(\$?\d+(?:\s*-\s*\$?\d+)?)\s*budget/i);
    const budgetContext = budgetMatch ? `within the budget of ${budgetMatch[1]}` : '';

    const interestMatch = query.match(/who likes\s+([^.]+)/i);
    const interestContext = interestMatch ? `related to ${interestMatch[1].trim()}` : '';

    const genderContext = isMale ? 'male' : isFemale ? 'female' : '';
    const genderInstruction = genderContext ? 
      `IMPORTANT: Only suggest gifts appropriate for ${genderContext} recipients.` : '';
    
    const cleanTitle = title.toLowerCase().replace(/[^\w\s]/g, ' ').trim();
    
    const contextualPrompt = `Find me 8 gift suggestions similar to "${cleanTitle}" ${ageContext} ${budgetContext} ${interestContext}. ${genderInstruction}`;
    
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