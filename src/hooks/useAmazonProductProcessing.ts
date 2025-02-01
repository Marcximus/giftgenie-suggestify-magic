import { useQueryClient } from '@tanstack/react-query';
import { GiftSuggestion } from '@/types/suggestions';
import { logApiMetrics, markOperation, trackSlowOperation } from '@/utils/metricsUtils';
import { processInParallel } from '@/utils/parallelProcessing';
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SLOW_OPERATION_THRESHOLD = 2000; // 2 seconds

export const useAmazonProductProcessing = () => {
  const queryClient = useQueryClient();

  const processGiftSuggestion = async (suggestion: GiftSuggestion): Promise<GiftSuggestion> => {
    const startTime = performance.now();
    const operationMark = markOperation(`process-suggestion-${suggestion.title}`);
    
    try {
      if (!suggestion.title) {
        console.error('Invalid suggestion:', suggestion);
        throw new Error('Invalid suggestion: missing title');
      }

      const normalizedTitle = suggestion.title.toLowerCase().trim();
      const cacheKey = ['amazon-product', normalizedTitle];
      const cachedData = queryClient.getQueryData(cacheKey);
      
      if (cachedData) {
        console.log('Cache hit for:', suggestion.title);
        await logApiMetrics('amazon-product-processing', startTime, 'success');
        operationMark.end();
        return cachedData as GiftSuggestion;
      }

      // Call the get-amazon-products Edge Function
      console.log('Calling get-amazon-products for:', suggestion.title);
      const { data: amazonProduct, error } = await supabase.functions.invoke('get-amazon-products', {
        body: { 
          searchTerm: suggestion.title,
          priceRange: suggestion.priceRange 
        }
      });

      if (error) {
        console.error('Error calling get-amazon-products:', error);
        throw error;
      }

      if (!amazonProduct?.product) {
        console.log('No Amazon product found for:', suggestion.title);
        return suggestion;
      }

      const product = amazonProduct.product;
      
      const processedSuggestion = {
        ...suggestion,
        title: product.title || suggestion.title,
        description: suggestion.description,
        priceRange: `${product.currency || 'USD'} ${product.price || 0}`,
        amazon_asin: product.asin,
        amazon_url: product.asin ? `https://www.amazon.com/dp/${product.asin}` : undefined,
        amazon_price: product.price,
        amazon_image_url: product.imageUrl,
        amazon_rating: product.rating,
        amazon_total_ratings: product.totalRatings
      };

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
        SLOW_OPERATION_THRESHOLD,
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