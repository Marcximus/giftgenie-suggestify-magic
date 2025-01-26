import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { GiftSuggestion } from '@/types/suggestions';
import { useQueryClient } from '@tanstack/react-query';
import { updateSearchFrequency } from '@/utils/searchFrequencyUtils';
import { generateCustomDescription } from '@/utils/descriptionUtils';
import { logApiMetrics, markOperation, trackSlowOperation } from '@/utils/metricsUtils';
import { processInParallel, retryWithBackoff } from '@/utils/parallelProcessing';
import { toast } from "@/components/ui/use-toast";

const SLOW_OPERATION_THRESHOLD = 2000; // 2 seconds

export const useAmazonProductProcessing = () => {
  const { getAmazonProduct } = useAmazonProducts();
  const queryClient = useQueryClient();

  const processGiftSuggestion = async (suggestion: GiftSuggestion): Promise<GiftSuggestion> => {
    const startTime = performance.now();
    const operationMark = markOperation(`process-suggestion-${suggestion.title}`);
    
    try {
      const normalizedTitle = suggestion.title.toLowerCase().trim();
      const cacheKey = ['amazon-product', normalizedTitle];
      const cachedData = queryClient.getQueryData(cacheKey);
      
      if (cachedData) {
        console.log('Cache hit for:', suggestion.title);
        await logApiMetrics('amazon-product-processing', startTime, 'success', undefined, true);
        operationMark.end();
        return cachedData as GiftSuggestion;
      }

      // Track Amazon API call performance
      const amazonProduct = await trackSlowOperation(
        'amazon-api-call',
        1000, // 1 second threshold for API calls
        () => retryWithBackoff(() => getAmazonProduct(suggestion.title, suggestion.priceRange))
      );
      
      // Process description and search frequency in parallel
      const [customDescription] = await Promise.all([
        trackSlowOperation(
          'generate-description',
          500,
          () => generateCustomDescription(suggestion.title, suggestion.description)
        ),
        trackSlowOperation(
          'update-search-frequency',
          200,
          () => updateSearchFrequency(suggestion.title)
        )
      ]);
      
      if (amazonProduct && amazonProduct.asin) {
        const processedSuggestion = {
          ...suggestion,
          title: amazonProduct.title || suggestion.title,
          description: customDescription,
          priceRange: `${amazonProduct.currency} ${amazonProduct.price}`,
          amazon_asin: amazonProduct.asin,
          amazon_url: `https://www.amazon.com/dp/${amazonProduct.asin}`,
          amazon_price: amazonProduct.price,
          amazon_image_url: amazonProduct.imageUrl,
          amazon_rating: amazonProduct.rating,
          amazon_total_ratings: amazonProduct.totalRatings
        };

        // Update cache with enriched data
        queryClient.setQueryData(cacheKey, processedSuggestion);
        queryClient.invalidateQueries({ queryKey: ['suggestions'] });
        
        await logApiMetrics('amazon-product-processing', startTime, 'success');
        operationMark.end();
        return processedSuggestion;
      }
      
      operationMark.end();
      return suggestion;
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
    
    console.log('Starting parallel processing of suggestions');
    
    try {
      const results = await trackSlowOperation(
        'parallel-processing',
        SLOW_OPERATION_THRESHOLD,
        () => processInParallel(
          suggestions,
          processGiftSuggestion,
          {
            batchSize: 8,
            maxConcurrent: 4,
            delayBetweenBatches: 200
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