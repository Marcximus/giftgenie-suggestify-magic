import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GiftSuggestion } from '@/types/suggestions';
import { logApiMetrics, markOperation, trackSlowOperation } from '@/utils/metricsUtils';
import { processInParallel } from '@/utils/parallelProcessing';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useAmazonProductProcessing = () => {
  const queryClient = useQueryClient();

  const processGiftSuggestion = async (suggestion: string | GiftSuggestion, priceRange?: { min: number; max: number }): Promise<GiftSuggestion> => {
    const startTime = performance.now();
    const operationMark = markOperation(`process-suggestion-${typeof suggestion === 'string' ? suggestion : suggestion.title}`);
    
    try {
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
        priceRange: priceRange,
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

      // Format request payload with price range
      const requestPayload = {
        searchTerm: initialSuggestion.title,
        priceRange // Pass the price range to the Edge Function
      };

      console.log('Invoking get-amazon-products Edge Function with payload:', JSON.stringify(requestPayload));

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
    
    console.log('Starting parallel processing of suggestions:', suggestions);
    
    try {
      const results = await trackSlowOperation(
        'parallel-processing',
        2000,
        () => processInParallel(
          suggestions,
          (suggestion) => processGiftSuggestion(suggestion, priceRange),
          {
            batchSize: 4,
            maxConcurrent: 2,
            delayBetweenBatches: 1000
          }
        )
      );
      
      // Update the suggestions cache with processed results
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

  return { processSuggestions };
};
