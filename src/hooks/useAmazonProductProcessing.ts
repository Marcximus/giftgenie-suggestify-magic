import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { GiftSuggestion } from '@/types/suggestions';
import { useQuery } from '@tanstack/react-query';

export const useAmazonProductProcessing = () => {
  const { getAmazonProduct } = useAmazonProducts();
  const { processBatch } = useBatchProcessor<GiftSuggestion, GiftSuggestion>();

  const processGiftSuggestion = async (suggestion: GiftSuggestion): Promise<GiftSuggestion> => {
    try {
      console.log('Processing suggestion:', suggestion.title);
      
      // Use React Query for caching individual product requests
      const { data: amazonProduct } = await useQuery({
        queryKey: ['amazon-product', suggestion.title, suggestion.priceRange],
        queryFn: () => getAmazonProduct(suggestion.title, suggestion.priceRange),
        staleTime: 1000 * 60 * 60, // Consider data fresh for 1 hour
        gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours (formerly cacheTime)
      });
      
      if (amazonProduct && amazonProduct.asin) {
        return {
          ...suggestion,
          title: amazonProduct.title || suggestion.title,
          description: amazonProduct.description || suggestion.description,
          priceRange: `${amazonProduct.currency} ${amazonProduct.price}`,
          amazon_asin: amazonProduct.asin,
          amazon_url: amazonProduct.asin ? `https://www.amazon.com/dp/${amazonProduct.asin}` : undefined,
          amazon_price: amazonProduct.price,
          amazon_image_url: amazonProduct.imageUrl,
          amazon_rating: amazonProduct.rating,
          amazon_total_ratings: amazonProduct.totalRatings
        };
      }
      return suggestion;
    } catch (error) {
      console.error('Error processing suggestion:', error);
      return suggestion;
    }
  };

  const processSuggestions = async (suggestions: GiftSuggestion[]) => {
    return processBatch(suggestions, {
      processFn: processGiftSuggestion,
      onError: (error, suggestion) => {
        console.error('Error processing suggestion:', suggestion.title, error);
        return suggestion;
      },
      parallel: true, // Enable parallel processing
      batchSize: 4, // Process 4 items at a time
      staggerDelay: 250 // Add small delay between items to prevent rate limiting
    });
  };

  return { processSuggestions };
};