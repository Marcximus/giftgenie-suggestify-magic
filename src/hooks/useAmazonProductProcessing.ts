import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GiftSuggestion } from '@/types/suggestions';
import { logApiMetrics, markOperation, trackSlowOperation } from '@/utils/metricsUtils';
import { processInParallel } from '@/utils/parallelProcessing';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useAmazonProductProcessing = () => {
  const queryClient = useQueryClient();

  const processGiftSuggestion = async (suggestion: GiftSuggestion): Promise<GiftSuggestion> => {
    const startTime = performance.now();
    const operationMark = markOperation(`process-suggestion-${suggestion.title}`);
    
    try {
      // Clean the title by removing parenthetical descriptions
      const cleanTitle = suggestion.title?.split('(')[0]?.trim();
      
      if (!cleanTitle) {
        console.error('Invalid suggestion:', suggestion);
        throw new Error('Invalid suggestion: missing title');
      }

      console.log('Processing suggestion:', {
        title: cleanTitle,
        priceRange: suggestion.priceRange,
        description: suggestion.description
      });

      const normalizedTitle = cleanTitle.toLowerCase().trim();
      const cacheKey = ['amazon-product', normalizedTitle];
      const cachedData = queryClient.getQueryData(cacheKey);
      
      if (cachedData) {
        console.log('Cache hit for:', cleanTitle);
        await logApiMetrics('amazon-product-processing', startTime, 'success');
        operationMark.end();
        return cachedData as GiftSuggestion;
      }

      // Extract price range if available
      const priceMatch = suggestion.priceRange?.match(/\$?(\d+(?:\.\d{2})?)\s*-\s*\$?(\d+(?:\.\d{2})?)/);
      const minPrice = priceMatch ? parseFloat(priceMatch[1]) : undefined;
      const maxPrice = priceMatch ? parseFloat(priceMatch[2]) : undefined;

      // Format request payload
      const requestPayload = {
        searchTerm: cleanTitle,
        priceRange: priceMatch ? { min: minPrice, max: maxPrice } : undefined
      };

      console.log('Invoking get-amazon-products Edge Function with payload:', requestPayload);

      const { data: response, error } = await supabase.functions.invoke('get-amazon-products', {
        body: requestPayload,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('Error calling get-amazon-products:', error);
        toast({
          title: "Error processing product",
          description: `Failed to process ${cleanTitle}. Please try again.`,
          variant: "destructive",
        });
        throw error;
      }

      console.log('Edge Function response:', response);

      if (!response?.product) {
        console.log('No Amazon product found for:', cleanTitle);
        return suggestion;
      }

      const product = response.product;
      console.log('Processing Amazon product:', product);
      
      const processedSuggestion = {
        ...suggestion,
        title: cleanTitle,
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
      return suggestion;
    }
  };

  const processSuggestions = async (suggestions: GiftSuggestion[]) => {
    const startTime = performance.now();
    const operationMark = markOperation('process-suggestions-batch');
    
    console.log('Starting parallel processing of suggestions:', suggestions);
    
    try {
      const results = await trackSlowOperation(
        'parallel-processing',
        2000,
        () => processInParallel(
          suggestions,
          processGiftSuggestion,
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