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
      console.log('Processing suggestion:', suggestion.title);
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
        () => retryWithBackoff(
          async () => {
            const result = await getAmazonProduct(suggestion.title, suggestion.priceRange);
            console.log('Amazon API response:', result);
            return result;
          },
          3, // maxRetries
          1000, // baseDelay
          5000 // maxDelay
        )
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
        console.log('Successfully processed Amazon product:', {
          title: amazonProduct.title,
          asin: amazonProduct.asin,
          price: amazonProduct.price
        });

        const processedSuggestion = {
          ...suggestion,
          title: amazonProduct.title || suggestion.title,
          description: customDescription,
          priceRange: amazonProduct.price ? `USD ${amazonProduct.price}` : suggestion.priceRange,
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
      } else {
        console.warn('No Amazon product data found for:', suggestion.title);
      }
      
      operationMark.end();
      return suggestion;
    } catch (error) {
      console.error('Error processing suggestion:', error);
      toast({
        title: "Error processing product",
        description: "Failed to fetch product details. Please try again.",
        variant: "destructive"
      });
      await logApiMetrics('amazon-product-processing', startTime, 'error', error.message);
      operationMark.end();
      return suggestion;
    }
  };

  const processSuggestions = async (suggestions: GiftSuggestion[]) => {
    const startTime = performance.now();
    const operationMark = markOperation('process-suggestions-batch');
    
    console.log('Starting parallel processing of suggestions:', suggestions.length);
    
    try {
      const results = await trackSlowOperation(
        'parallel-processing',
        SLOW_OPERATION_THRESHOLD,
        () => processInParallel(
          suggestions,
          processGiftSuggestion,
          {
            batchSize: 4, // Reduced from 8 to improve reliability
            maxConcurrent: 2, // Reduced from 4 to avoid rate limits
            delayBetweenBatches: 500 // Increased delay between batches
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
      toast({
        title: "Error processing suggestions",
        description: "Failed to process some suggestions. Please try again.",
        variant: "destructive"
      });
      await logApiMetrics('batch-processing', startTime, 'error', error.message);
      operationMark.end();
      throw error;
    }
  };

  return { processSuggestions };
};