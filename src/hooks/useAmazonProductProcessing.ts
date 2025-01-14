import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { GiftSuggestion } from '@/types/suggestions';
import { useQueryClient } from '@tanstack/react-query';
import { updateSearchFrequency } from '@/utils/searchFrequencyUtils';
import { generateCustomDescription } from '@/utils/descriptionUtils';
import { logApiMetrics } from '@/utils/metricsUtils';
import { toast } from "@/components/ui/use-toast";

const BATCH_SIZE = 3;
const STAGGER_DELAY = 200;
const MAX_CONCURRENT = 3;

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
    console.log('Processing suggestions with priority batching');
    
    // Split suggestions into interest-related and general
    const interestRelated = suggestions.filter(s => 
      s.reason?.toLowerCase().includes('interest') || 
      s.reason?.toLowerCase().includes('likes')
    );
    const general = suggestions.filter(s => !interestRelated.includes(s));
    
    console.log(`Split suggestions: ${interestRelated.length} interest-related, ${general.length} general`);
    
    // Process interest-related suggestions first
    const interestResults = await Promise.all(
      interestRelated.map(async (suggestion) => {
        try {
          return await processGiftSuggestion(suggestion);
        } catch (error) {
          console.error('Error processing interest-related suggestion:', error);
          return suggestion;
        }
      })
    );
    
    // Only process enough general suggestions to reach 8 total
    const successfulInterestResults = interestResults.filter(r => r.amazon_asin);
    const remainingNeeded = 8 - successfulInterestResults.length;
    
    const generalResults = remainingNeeded > 0
      ? await Promise.all(
          general.slice(0, remainingNeeded).map(async (suggestion) => {
            try {
              return await processGiftSuggestion(suggestion);
            } catch (error) {
              console.error('Error processing general suggestion:', error);
              return suggestion;
            }
          })
        )
      : [];
    
    const results = [...successfulInterestResults, ...generalResults];
    
    // Update the suggestions cache
    queryClient.setQueryData(['suggestions'], results);
    
    return results;
  };

  return { processSuggestions };
};