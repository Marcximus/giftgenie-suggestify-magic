import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { GiftSuggestion } from '@/types/suggestions';
import { useQueryClient } from '@tanstack/react-query';
import { updateSearchFrequency, getPopularSearches } from '@/utils/searchFrequencyUtils';
import { generateCustomDescription } from '@/utils/descriptionUtils';
import { logApiMetrics } from '@/utils/metricsUtils';
import { toast } from "@/components/ui/use-toast";

const BATCH_SIZE = 4; // Reduced from 8 to lower concurrent requests
const STAGGER_DELAY = 2000; // Increased from 100ms to 2s between requests

export const useAmazonProductProcessing = () => {
  const { getAmazonProduct } = useAmazonProducts();
  const { processBatch } = useBatchProcessor<GiftSuggestion, GiftSuggestion>();
  const queryClient = useQueryClient();

  // Process suggestions one at a time to avoid rate limits
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
      
      // Process product data and custom description sequentially
      const customDescription = await generateCustomDescription(
        suggestion.title,
        suggestion.description
      );

      // Add delay before Amazon API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const amazonProduct = await getAmazonProduct(suggestion.title, suggestion.priceRange);
      
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
    } catch (error: any) {
      console.error('Error processing suggestion:', error);
      
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
    console.log('Processing suggestions sequentially');
    const results: GiftSuggestion[] = [];
    
    // Process suggestions sequentially with proper delays
    for (const suggestion of suggestions) {
      try {
        const result = await processGiftSuggestion(suggestion);
        results.push(result);
        
        // Add a longer delay between processing each suggestion
        await new Promise(r => setTimeout(r, STAGGER_DELAY));
      } catch (error) {
        console.error('Error processing suggestion:', error);
        results.push(suggestion);
      }
    }
    
    return results;
  };

  return { processSuggestions };
};