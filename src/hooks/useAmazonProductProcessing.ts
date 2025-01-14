import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { GiftSuggestion } from '@/types/suggestions';
import { useQueryClient } from '@tanstack/react-query';
import { updateSearchFrequency } from '@/utils/searchFrequencyUtils';
import { generateCustomDescription } from '@/utils/descriptionUtils';
import { logApiMetrics } from '@/utils/metricsUtils';
import { toast } from "@/components/ui/use-toast";

const BATCH_SIZE = 8;
const STAGGER_DELAY = 200;
const MAX_CONCURRENT = 4;

export const useAmazonProductProcessing = () => {
  const { getAmazonProduct } = useAmazonProducts();
  const { processBatch } = useBatchProcessor<GiftSuggestion, GiftSuggestion>();
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

      // Run these operations in parallel
      const [amazonProduct, customDescription] = await Promise.all([
        getAmazonProduct(suggestion.title, suggestion.priceRange),
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

        // Update the cache with the enriched data
        queryClient.setQueryData(cacheKey, processedSuggestion);
        
        // Invalidate the suggestions query to trigger a re-render
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
    console.log('Processing suggestions with optimized settings');
    
    const results: GiftSuggestion[] = [];
    const processingPromises: Promise<void>[] = [];
    
    // Process suggestions in parallel batches
    for (let i = 0; i < suggestions.length; i += BATCH_SIZE) {
      const batch = suggestions.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (suggestion) => {
        try {
          const result = await processGiftSuggestion(suggestion);
          results.push(result);
          
          // Update the suggestions cache with each processed result
          queryClient.setQueryData(['suggestions'], (old: GiftSuggestion[] | undefined) => {
            if (!old) return results;
            return old.map(s => s.title === result.title ? result : s);
          });
        } catch (error) {
          console.error('Error in batch processing:', error);
        }
      });
      
      processingPromises.push(...batchPromises);
      
      if (i + BATCH_SIZE < suggestions.length) {
        await new Promise(r => setTimeout(r, STAGGER_DELAY));
      }
    }
    
    await Promise.all(processingPromises);
    return results;
  };

  return { processSuggestions };
};