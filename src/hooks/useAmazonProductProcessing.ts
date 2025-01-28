import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { GiftSuggestion } from '@/types/suggestions';
import { useQueryClient } from '@tanstack/react-query';
import { updateSearchFrequency } from '@/utils/searchFrequencyUtils';
import { generateCustomDescriptions } from '@/utils/descriptionUtils';
import { logApiMetrics, markOperation, trackSlowOperation } from '@/utils/metricsUtils';
import { processInParallel, retryWithBackoff } from '@/utils/parallelProcessing';
import { toast } from "@/components/ui/use-toast";

const SLOW_OPERATION_THRESHOLD = 2000; // 2 seconds
const BATCH_SIZE = 4; // Process 4 descriptions at a time

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
        await logApiMetrics('amazon-product-processing', startTime, 'success');
        operationMark.end();
        return cachedData as GiftSuggestion;
      }

      // Track Amazon API call performance
      const amazonProduct = await trackSlowOperation(
        'amazon-api-call',
        1000,
        () => retryWithBackoff(() => getAmazonProduct(suggestion.title, suggestion.priceRange))
      );

      // Store the suggestion temporarily without description
      const processedSuggestion = {
        ...suggestion,
        title: amazonProduct?.title || suggestion.title,
        description: suggestion.description, // Will be updated in batch
        priceRange: amazonProduct?.price ? `USD ${amazonProduct.price}` : suggestion.priceRange,
        amazon_asin: amazonProduct?.asin,
        amazon_url: amazonProduct?.asin ? `https://www.amazon.com/dp/${amazonProduct.asin}` : undefined,
        amazon_price: amazonProduct?.price,
        amazon_image_url: amazonProduct?.imageUrl,
        amazon_rating: amazonProduct?.rating,
        amazon_total_ratings: amazonProduct?.totalRatings
      };

      // Update cache with initial data
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
    
    console.log('Starting parallel processing of suggestions');
    
    try {
      // First, process all Amazon product data in parallel
      const processedSuggestions = await trackSlowOperation(
        'parallel-processing',
        SLOW_OPERATION_THRESHOLD,
        () => processInParallel(
          suggestions,
          processGiftSuggestion,
          {
            batchSize: BATCH_SIZE,
            maxConcurrent: 4,
            delayBetweenBatches: 200
          }
        )
      );

      // Then, batch process descriptions in groups of 4
      for (let i = 0; i < processedSuggestions.length; i += BATCH_SIZE) {
        const batch = processedSuggestions.slice(i, i + BATCH_SIZE);
        console.log(`Processing descriptions batch ${i / BATCH_SIZE + 1}`);
        
        const descriptions = await generateCustomDescriptions(
          batch.map(s => ({
            title: s.title,
            description: s.description
          }))
        );

        // Update suggestions with new descriptions
        descriptions.forEach((desc, index) => {
          const suggestionIndex = i + index;
          if (suggestionIndex < processedSuggestions.length) {
            processedSuggestions[suggestionIndex].description = desc;
          }
        });

        // Update the suggestions cache with processed results
        queryClient.setQueryData(['suggestions'], processedSuggestions);
      }
      
      await logApiMetrics('batch-processing', startTime, 'success');
      operationMark.end();
      return processedSuggestions;
    } catch (error) {
      console.error('Error in batch processing:', error);
      await logApiMetrics('batch-processing', startTime, 'error', error.message);
      operationMark.end();
      throw error;
    }
  };

  return { processSuggestions };
};