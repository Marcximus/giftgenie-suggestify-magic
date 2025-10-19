
import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useDeepSeekSuggestions from './useDeepSeekSuggestions';
import { useAmazonProductProcessing } from './useAmazonProductProcessing';
import { GiftSuggestion } from '@/types/suggestions';
import { debounce } from '@/utils/debounce';
import { supabase } from "@/integrations/supabase/client";

export const useSuggestions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [lastQuery, setLastQuery] = useState('');
  const { generateSuggestions } = useDeepSeekSuggestions();
  const { processSuggestions } = useAmazonProductProcessing();
  const queryClient = useQueryClient();
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Pre-warm the Edge Function on initial load to reduce cold start latency
  useEffect(() => {
    const preWarmEdgeFunction = async () => {
      if (isFirstLoad) {
        try {
          console.log('Pre-warming Edge Function...');
          await supabase.functions.invoke('get-amazon-products', {
            body: { searchTerm: 'test pre-warm' }
          });
          console.log('Edge Function pre-warmed successfully');
        } catch (error) {
          console.log('Pre-warming error (can be ignored):', error);
        } finally {
          setIsFirstLoad(false);
        }
      }
    };
    
    preWarmEdgeFunction();
  }, [isFirstLoad]);

  const trackSearchAnalytics = async (query: string, suggestions: GiftSuggestion[]) => {
    try {
      console.log('Tracking search analytics for query:', query);
      console.log('Suggestions to track:', suggestions);
      
      const titles = suggestions.map(s => s.title);
      console.log('Extracted titles:', titles);
      
      const { data, error } = await supabase.from('search_analytics').insert({
        search_query: query,
        suggestion_titles: titles,
        user_agent: navigator.userAgent
      }).select();

      if (error) {
        console.error('Supabase error tracking search:', error);
        throw error;
      }
      
      console.log('Successfully tracked search analytics:', data);
    } catch (error) {
      console.error('Error tracking search analytics:', error);
    }
  };

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
    
    // Update URL with search query to make it shareable
    if (query) {
      setSearchParams({ q: query });
    }
    
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
    const query = lastQuery.toLowerCase();
    
    // Extract key product characteristics from the title
    const keywords = title.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(word => 
        !['with', 'and', 'in', 'for', 'by', 'the', 'a', 'an'].includes(word)
      )
      .filter(word => word.length > 2)
      .slice(0, 3)
      .join(' ');
    
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

    const genderContext = isMale ? 'male' : isFemale ? 'female' : '';
    const genderInstruction = genderContext ? 
      `IMPORTANT: Only suggest gifts appropriate for ${genderContext} recipients.` : '';
    
    const contextualPrompt = `Find me 8 gift suggestions that are very similar to "${keywords}" in terms of type, style, and purpose. Focus on products that serve a similar function or appeal to people who would like "${title}". ${ageContext} ${budgetContext} ${genderInstruction}

IMPORTANT GUIDELINES:
- Suggest products that are DIRECTLY related to or complement "${keywords}"
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
