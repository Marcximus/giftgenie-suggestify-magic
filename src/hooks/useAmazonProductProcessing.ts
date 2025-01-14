import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { GiftSuggestion } from '@/types/suggestions';
import { useQueryClient } from '@tanstack/react-query';
import { updateSearchFrequency, getPopularSearches } from '@/utils/searchFrequencyUtils';
import { generateCustomDescription } from '@/utils/descriptionUtils';
import { logApiMetrics } from '@/utils/metricsUtils';
import { toast } from "@/components/ui/use-toast";

// Reduced from 8 to 4 to stay well within rate limits
const BATCH_SIZE = 4;
// Increased from 100ms to 500ms to reduce rate limit issues
const STAGGER_DELAY = 500;
// Maximum concurrent requests
const MAX_CONCURRENT = 2;

export const useAmazonProductProcessing = () => {
  const { getAmazonProduct } = useAmazonProducts();
  const { processBatch } = useBatchProcessor<GiftSuggestion, GiftSuggestion>();
  const queryClient = useQueryClient();

  // Request queue implementation
  const requestQueue: Array<() => Promise<void>> = [];
  let isProcessing = false;

  const processQueue = async () => {
    if (isProcessing || requestQueue.length === 0) return;
    
    isProcessing = true;
    while (requestQueue.length > 0) {
      const request = requestQueue.shift();
      if (request) {
        await request();
        // Add delay between queue processing
        await new Promise(resolve => setTimeout(resolve, STAGGER_DELAY));
      }
    }
    isProcessing = false;
  };

  const warmCache = async () => {
    try {
      const popularSearches = await getPopularSearches();
      if (popularSearches) {
        // Process popular searches sequentially to avoid rate limits
        for (const { search_term } of popularSearches) {
          await getAmazonProduct(search_term, '');
          // Add delay between cache warming requests
          await new Promise(resolve => setTimeout(resolve, STAGGER_DELAY));
        }
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
    console.log('Processing suggestions with improved rate limiting');
    
    // Start cache warming in the background with reduced aggressiveness
    setTimeout(() => warmCache().catch(console.error), STAGGER_DELAY * 2);
    
    const results: GiftSuggestion[] = [];
    const processingPromises: Promise<void>[] = [];
    
    // Process suggestions in smaller batches with better spacing
    for (let i = 0; i < suggestions.length; i += BATCH_SIZE) {
      const batch = suggestions.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1}`);
      
      // Process each suggestion in the batch with controlled concurrency
      const batchPromises = batch.map((suggestion, index) => 
        new Promise<void>(async (resolve) => {
          // Add to queue instead of processing immediately
          requestQueue.push(async () => {
            try {
              const result = await processGiftSuggestion(suggestion);
              results.push(result);
            } catch (error) {
              console.error('Error in request queue:', error);
            }
            resolve();
          });
          
          // Start queue processing if not already running
          if (!isProcessing) {
            processQueue().catch(console.error);
          }
        })
      );
      
      processingPromises.push(...batchPromises);
      
      // Wait longer between batches to avoid rate limits
      if (i + BATCH_SIZE < suggestions.length) {
        await new Promise(r => setTimeout(r, STAGGER_DELAY * 2));
      }
    }
    
    // Wait for all processing to complete
    await Promise.all(processingPromises);
    
    return results;
  };

  return { processSuggestions };
};