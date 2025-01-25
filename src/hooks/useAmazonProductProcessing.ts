import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { GiftSuggestion } from '@/types/suggestions';
import { useQueryClient } from '@tanstack/react-query';
import { updateSearchFrequency } from '@/utils/searchFrequencyUtils';
import { generateCustomDescription } from '@/utils/descriptionUtils';
import { logApiMetrics } from '@/utils/metricsUtils';
import { toast } from "@/components/ui/use-toast";

const BATCH_SIZE = 4; // Reduced from 8 to 4 for better throughput
const STAGGER_DELAY = 50; // Reduced from 100ms to 50ms
const MAX_CONCURRENT = 4; // Match batch size

export const useAmazonProductProcessing = () => {
  const { getAmazonProduct } = useAmazonProducts();
  const { processBatch } = useBatchProcessor<GiftSuggestion, GiftSuggestion>();
  const queryClient = useQueryClient();

  const processGiftSuggestion = async (suggestion: GiftSuggestion): Promise<GiftSuggestion> => {
    const startTime = performance.now();
    const cacheKey = ['amazon-product', suggestion.title.toLowerCase().trim()];
    
    try {
      // Check cache first
      const cachedData = queryClient.getQueryData(cacheKey);
      if (cachedData) {
        console.log('Cache hit for:', suggestion.title);
        return cachedData as GiftSuggestion;
      }

      // Run all async operations in parallel
      const [amazonProduct, customDescription] = await Promise.all([
        getAmazonProduct(suggestion.title, suggestion.priceRange),
        generateCustomDescription(suggestion.title, suggestion.description),
        updateSearchFrequency(suggestion.title)
      ]);

      if (!amazonProduct) {
        console.log('No Amazon product found for:', suggestion.title);
        return suggestion;
      }

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

      // Update cache
      queryClient.setQueryData(cacheKey, processedSuggestion);
      
      await logApiMetrics('amazon-product-processing', startTime, 'success');
      return processedSuggestion;
    } catch (error) {
      console.error('Error processing suggestion:', error);
      await logApiMetrics('amazon-product-processing', startTime, 'error', error.message);
      return suggestion;
    }
  };

  const processSuggestions = async (suggestions: GiftSuggestion[]) => {
    console.log(`Processing ${suggestions.length} suggestions in parallel batches`);
    const results: GiftSuggestion[] = [];
    
    // Process suggestions in smaller batches
    for (let i = 0; i < suggestions.length; i += BATCH_SIZE) {
      const batchStart = performance.now();
      const batch = suggestions.slice(i, i + BATCH_SIZE);
      
      // Process all items in current batch concurrently
      const batchResults = await Promise.all(
        batch.map(suggestion => processGiftSuggestion(suggestion))
      );
      
      results.push(...batchResults);
      
      // Update cache after each batch
      queryClient.setQueryData(['suggestions'], (old: GiftSuggestion[] | undefined) => {
        if (!old) return results;
        return old.map(oldSuggestion => {
          const updated = results.find(r => r.title === oldSuggestion.title);
          return updated || oldSuggestion;
        });
      });

      const batchTime = performance.now() - batchStart;
      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} completed in ${batchTime.toFixed(2)}ms`);
      
      // Add minimal delay between batches to prevent rate limiting
      if (i + BATCH_SIZE < suggestions.length) {
        await new Promise(resolve => setTimeout(resolve, STAGGER_DELAY));
      }
    }

    return results;
  };

  return { processSuggestions };
};