
import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
          await supabase.functions.invoke('get-amazon-products', {
            body: { searchTerm: 'test pre-warm' }
          });
        } catch (error) {
          // Silently ignore pre-warm errors
        } finally {
          setIsFirstLoad(false);
        }
      }
    };

    preWarmEdgeFunction();
  }, [isFirstLoad]);

  const trackSearchAnalytics = async (query: string, suggestions: GiftSuggestion[]) => {
    try {
      const titles = suggestions.map(s => s.title);

      await supabase.from('search_analytics').insert({
        search_query: query,
        suggestion_titles: titles,
        user_agent: navigator.userAgent
      }).select();
    } catch (error) {
      // Silently ignore analytics errors
    }
  };

  const { data: suggestions = [], isPending: isLoading, mutate: fetchSuggestions } = useMutation({
    mutationFn: async (query: string) => {
      const startTime = performance.now();
      try {
        const response = await generateSuggestions(query);

        if (!response || !response.suggestions) {
          throw new Error('Failed to generate valid suggestions');
        }

        const { suggestions: newSuggestions, priceRange } = response;

        if (newSuggestions.length > 0) {
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

          return results;
        }

        return [];
      } catch (error) {
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
      queryClient.setQueryData(['suggestions'], data);
    }
  });

  const debouncedSearch = debounce(async (query: string) => {
    setLastQuery(query);
    await fetchSuggestions(query);
  }, 300, { leading: true, trailing: true });

  const handleSearch = async (query: string) => {
    setLastQuery(query);

    // Update URL with search query to make it shareable
    if (query) {
      setSearchParams({ q: query });
    }

    await debouncedSearch(query);
  };

  const handleGenerateMore = async () => {
    if (lastQuery) {
      await fetchSuggestions(lastQuery);
    }
  };

  const handleMoreLikeThis = async (title: string) => {
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

    setLastQuery(contextualPrompt);
    await fetchSuggestions(contextualPrompt);
  };

  const handleStartOver = () => {
    setSearchParams({});
    queryClient.setQueryData(['suggestions'], []);
    setLastQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
