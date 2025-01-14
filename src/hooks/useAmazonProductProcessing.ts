import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { GiftSuggestion } from '@/types/suggestions';
import { useQueryClient } from '@tanstack/react-query';
import { updateSearchFrequency } from '@/utils/searchFrequencyUtils';
import { generateCustomDescription } from '@/utils/descriptionUtils';
import { logApiMetrics } from '@/utils/metricsUtils';
import { toast } from "@/components/ui/use-toast";

const BATCH_SIZE = 3; // Process 3 products at a time
const STAGGER_DELAY = 200; // 200ms delay between batches
const MAX_CONCURRENT = 3; // Maximum concurrent API calls

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

      // Run these operations in parallel using Promise.all
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
    console.log('Processing suggestions with parallel batches');
    
    const results: GiftSuggestion[] = [];
    const batches: GiftSuggestion[][] = [];
    
    // Split suggestions into batches of BATCH_SIZE
    for (let i = 0; i < suggestions.length; i += BATCH_SIZE) {
      batches.push(suggestions.slice(i, i + BATCH_SIZE));
    }
    
    // Process each batch in parallel
    for (const batch of batches) {
      console.log(`Processing batch of ${batch.length} suggestions`);
      
      // Process all items in the current batch concurrently
      const batchResults = await Promise.all(
        batch.map(async (suggestion) => {
          try {
            return await processGiftSuggestion(suggestion);
          } catch (error) {
            console.error('Error in batch processing:', error);
            return suggestion;
          }
        })
      );
      
      results.push(...batchResults);
      
      // Add a small delay between batches to prevent rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, STAGGER_DELAY));
      }
      
      // Update the suggestions cache with each processed batch
      queryClient.setQueryData(['suggestions'], (old: GiftSuggestion[] | undefined) => {
        if (!old) return results;
        return old.map(oldSuggestion => {
          const updatedSuggestion = results.find(
            result => result.title === oldSuggestion.title
          );
          return updatedSuggestion || oldSuggestion;
        });
      });
    }
    
    return results;
  };

  return { processSuggestions };
};