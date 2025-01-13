import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { GiftSuggestion } from '@/types/suggestions';
import { useQueryClient } from '@tanstack/react-query';
import { updateSearchFrequency, getPopularSearches } from '@/utils/searchFrequencyUtils';
import { generateCustomDescription } from '@/utils/descriptionUtils';
import { logApiMetrics } from '@/utils/metricsUtils';
import { toast } from "@/components/ui/use-toast";

const BATCH_SIZE = 8; // Reduced from 10 to stay within rate limits
const STAGGER_DELAY = 100; // Increased from 50ms to reduce rate limit issues

export const useAmazonProductProcessing = () => {
  const { getAmazonProduct } = useAmazonProducts();
  const { processBatch } = useBatchProcessor<GiftSuggestion, GiftSuggestion>();
  const queryClient = useQueryClient();

  const warmCache = async () => {
    try {
      const popularSearches = await getPopularSearches();
      if (popularSearches) {
        const warmingPromises = popularSearches.map(({ search_term }) => 
          getAmazonProduct(search_term, '')
        );
        await Promise.allSettled(warmingPromises);
      }
    } catch (error) {
      console.error('Error warming cache:', error);
    }
  };

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

      await updateSearchFrequency(suggestion.title);

      console.log('Processing suggestion:', suggestion.title);
      
      // Parallel processing of product data and custom description
      const [amazonProduct, customDescription] = await Promise.all([
        getAmazonProduct(suggestion.title, suggestion.priceRange),
        generateCustomDescription(
          suggestion.title,
          suggestion.description
        )
      ]);
      
      if (amazonProduct && amazonProduct.asin) {
        const processedSuggestion = {
          ...suggestion,
          title: amazonProduct.title || suggestion.title,
          description: customDescription,
          priceRange: `${amazonProduct.currency} ${amazonProduct.price}`,
          amazon_asin: amazonProduct.asin,
          amazon_url: amazonProduct.asin ? `https://www.amazon.com/dp/${amazonProduct.asin}` : undefined,
          amazon_price: amazonProduct.price,
          amazon_image_url: amazonProduct.imageUrl,
          amazon_rating: amazonProduct.rating,
          amazon_total_ratings: amazonProduct.totalRatings
        };

        queryClient.setQueryData(cacheKey, processedSuggestion);
        await logApiMetrics('amazon-product-processing', startTime, 'success');
        return processedSuggestion;
      }
      
      return suggestion;
    } catch (error) {
      console.error('Error processing suggestion:', error);
      
      // Handle rate limit errors specifically
      if (error.status === 429) {
        const retryAfter = error.retryAfter || 30;
        toast({
          title: "Rate limit reached",
          description: `Please wait ${retryAfter} seconds before trying again`,
          variant: "destructive",
        });
        // Wait for the specified time before continuing
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      }
      
      await logApiMetrics('amazon-product-processing', startTime, 'error', error.message);
      return suggestion;
    }
  };

  const processSuggestions = async (suggestions: GiftSuggestion[]) => {
    console.log('Processing suggestions in parallel batches');
    
    // Start cache warming in the background
    warmCache().catch(console.error);
    
    const results: GiftSuggestion[] = [];
    
    for (let i = 0; i < suggestions.length; i += BATCH_SIZE) {
      const batch = suggestions.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1}`);
      
      const batchPromises = batch.map((suggestion, index) => 
        new Promise<GiftSuggestion>(async (resolve) => {
          if (index > 0) {
            await new Promise(r => setTimeout(r, index * STAGGER_DELAY));
          }
          const result = await processGiftSuggestion(suggestion);
          resolve(result);
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add a longer delay between batches to avoid rate limits
      if (i + BATCH_SIZE < suggestions.length) {
        await new Promise(r => setTimeout(r, STAGGER_DELAY * 2));
      }
    }
    
    return results;
  };

  return { processSuggestions };
};