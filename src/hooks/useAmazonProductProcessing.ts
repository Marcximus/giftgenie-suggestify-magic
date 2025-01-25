import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { GiftSuggestion } from '@/types/suggestions';
import { useQueryClient } from '@tanstack/react-query';
import { updateSearchFrequency } from '@/utils/searchFrequencyUtils';
import { generateCustomDescription } from '@/utils/descriptionUtils';
import { logApiMetrics } from '@/utils/metricsUtils';
import { processInParallel, retryWithBackoff } from '@/utils/parallelProcessing';
import { toast } from "@/components/ui/use-toast";

export const useAmazonProductProcessing = () => {
  const { getAmazonProduct } = useAmazonProducts();
  const queryClient = useQueryClient();

  const processGiftSuggestion = async (suggestion: GiftSuggestion): Promise<GiftSuggestion> => {
    const startTime = performance.now();
    
    try {
      const normalizedTitle = suggestion.title.toLowerCase().trim();
      const cacheKey = ['amazon-product', normalizedTitle];
      const cachedData = queryClient.getQueryData(cacheKey);
      
      if (cachedData) {
        console.log('Cache hit for:', suggestion.title);
        await logApiMetrics('amazon-product-processing', startTime, 'success', undefined, true);
        return cachedData as GiftSuggestion;
      }

      // Use retryWithBackoff for the Amazon API call
      const amazonProduct = await retryWithBackoff(() => 
        getAmazonProduct(suggestion.title, suggestion.priceRange)
      );
      
      // Process description and search frequency in parallel
      const [customDescription] = await Promise.all([
        generateCustomDescription(suggestion.title, suggestion.description),
        updateSearchFrequency(suggestion.title)
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
        return processedSuggestion;
      }
      
      return suggestion;
    } catch (error) {
      console.error('Error processing suggestion:', error);
      await logApiMetrics('amazon-product-processing', startTime, 'error', error.message);
      return suggestion;
    }
  };

  const processSuggestions = async (suggestions: GiftSuggestion[]) => {
    console.log('Starting parallel processing of suggestions');
    
    const results = await processInParallel(
      suggestions,
      processGiftSuggestion,
      {
        batchSize: 8,
        maxConcurrent: 4,
        delayBetweenBatches: 200
      }
    );
    
    // Update the suggestions cache with processed results
    queryClient.setQueryData(['suggestions'], results);
    
    return results;
  };

  return { processSuggestions };
};