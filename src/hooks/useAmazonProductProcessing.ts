
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GiftSuggestion } from '@/types/suggestions';
import { logApiMetrics, markOperation, trackSlowOperation } from '@/utils/metricsUtils';
import { processInParallel, processWithProgressiveResults } from '@/utils/parallelProcessing';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useAmazonProductProcessing = () => {
  const queryClient = useQueryClient();
  const [progressResults, setProgressResults] = useState<GiftSuggestion[]>([]);

  const processGiftSuggestion = async (suggestion: string | GiftSuggestion, priceRange?: { min: number; max: number }): Promise<GiftSuggestion> => {
    const startTime = performance.now();
    const operationMark = markOperation(`process-suggestion-${typeof suggestion === 'string' ? suggestion : suggestion.title}`);
    
    try {
      // If suggestion is a string, convert it to a GiftSuggestion object
      const initialSuggestion: GiftSuggestion = typeof suggestion === 'string' ? {
        title: suggestion,
        description: suggestion,
        priceRange: 'Check price on Amazon',
        reason: `This ${suggestion} matches your requirements.`,
        search_query: suggestion
      } : suggestion;

      if (!initialSuggestion.title) {
        console.error('Invalid suggestion:', initialSuggestion);
        throw new Error('Invalid suggestion: missing title');
      }

      console.log('Processing suggestion:', {
        title: initialSuggestion.title,
        priceRange: initialSuggestion.priceRange,
        description: initialSuggestion.description
      });

      const normalizedTitle = initialSuggestion.title.toLowerCase().trim();
      const cacheKey = ['amazon-product', normalizedTitle];
      const cachedData = queryClient.getQueryData(cacheKey);
      
      if (cachedData) {
        console.log('Cache hit for:', initialSuggestion.title);
        await logApiMetrics('amazon-product-processing', startTime, 'success');
        operationMark.end();
        return cachedData as GiftSuggestion;
      }

      // Format request payload
      const requestPayload = {
        searchTerm: initialSuggestion.title,
        priceRange: priceRange // Pass the price range from generate-gift-suggestions
      };

      console.log('Invoking get-amazon-products Edge Function with payload:', JSON.stringify(requestPayload));

      // Make sure the request body is properly formatted and not empty
      if (!requestPayload.searchTerm) {
        throw new Error('Search term is required');
      }

      // Explicitly stringify the request body
      const { data: response, error } = await supabase.functions.invoke('get-amazon-products', {
        body: requestPayload
      });

      if (error) {
        console.error('Error calling get-amazon-products:', error);
        toast({
          title: "Error processing product",
          description: `Failed to process ${initialSuggestion.title}. Please try again.`,
          variant: "destructive",
        });
        throw error;
      }

      console.log('Edge Function response:', response);

      if (!response?.product) {
        console.log('No Amazon product found for:', initialSuggestion.title);
        return initialSuggestion;
      }

      const product = response.product;
      console.log('Processing Amazon product:', product);
      
      const processedSuggestion = {
        ...initialSuggestion,
        amazon_asin: product.asin,
        amazon_url: product.asin ? `https://www.amazon.com/dp/${product.asin}` : undefined,
        amazon_price: product.price,
        amazon_image_url: product.imageUrl,
        amazon_rating: product.rating,
        amazon_total_ratings: product.totalRatings
      };

      console.log('Processed suggestion:', processedSuggestion);

      // Update cache with enriched data
      queryClient.setQueryData(cacheKey, processedSuggestion);
      
      await logApiMetrics('amazon-product-processing', startTime, 'success');
      operationMark.end();
      return processedSuggestion;
    } catch (error) {
      console.error('Error processing suggestion:', error);
      await logApiMetrics('amazon-product-processing', startTime, 'error', error.message);
      operationMark.end();
      throw error;
    }
  };

  const processSuggestions = async (suggestions: (string | GiftSuggestion)[], priceRange?: { min: number; max: number }) => {
    const startTime = performance.now();
    const operationMark = markOperation('process-suggestions-batch');
    
    console.log('Starting progressive processing of suggestions:', suggestions);
    
    try {
      // First, create initial placeholder results for all suggestions
      const initialResults: GiftSuggestion[] = suggestions.map(suggestion => {
        if (typeof suggestion === 'string') {
          return {
            title: suggestion,
            description: suggestion,
            priceRange: 'Processing...',
            reason: `This ${suggestion} matches your requirements.`,
            search_query: suggestion
          };
        }
        return suggestion;
      });
      
      // Update cache with initial placeholder results
      queryClient.setQueryData(['suggestions'], initialResults);
      
      // Process suggestions with progressive updates
      const results = await processWithProgressiveResults(
        suggestions,
        async (suggestion) => {
          const result = await processGiftSuggestion(suggestion, priceRange);
          return result;
        },
        (result, index) => {
          // This callback will be called each time an item is processed
          console.log(`Progressive result received for index ${index}:`, result);
          
          // Update the suggestions in the cache with this new result
          queryClient.setQueryData(['suggestions'], (old: GiftSuggestion[] | undefined) => {
            if (!old) return [result];
            
            // Create a new array with the updated suggestion
            const updated = [...old];
            // Find the right index to update 
            const updateIndex = updated.findIndex(s => 
              (typeof suggestion === 'string' && s.title === suggestion) ||
              (typeof suggestion !== 'string' && s.title === suggestion.title)
            );
            
            if (updateIndex !== -1) {
              updated[updateIndex] = result;
            } else if (index < updated.length) {
              updated[index] = result;
            } else {
              updated.push(result);
            }
            
            return updated;
          });
        },
        {
          batchSize: 4,
          delayBetweenBatches: 150 // Slightly faster than before
        }
      );
      
      // Final update with all processed results
      queryClient.setQueryData(['suggestions'], results);
      
      await logApiMetrics('batch-processing', startTime, 'success');
      operationMark.end();
      return results;
    } catch (error) {
      console.error('Error in batch processing:', error);
      await logApiMetrics('batch-processing', startTime, 'error', error.message);
      operationMark.end();
      throw error;
    }
  };

  return { processSuggestions, progressResults };
};
