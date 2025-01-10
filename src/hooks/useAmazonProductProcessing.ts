import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { GiftSuggestion } from '@/types/suggestions';
import { useQueryClient } from '@tanstack/react-query';

export const useAmazonProductProcessing = () => {
  const { getAmazonProduct } = useAmazonProducts();
  const { processBatch } = useBatchProcessor<GiftSuggestion, GiftSuggestion>();
  const queryClient = useQueryClient();

  const processGiftSuggestion = async (suggestion: GiftSuggestion): Promise<GiftSuggestion> => {
    try {
      if (!suggestion?.title) {
        console.error('Invalid suggestion:', suggestion);
        return {
          title: 'Untitled Product',
          description: 'No description available',
          priceRange: 'Price unavailable',
          reason: 'This item matches your requirements.',
          search_query: '',
        };
      }

      console.log('Processing suggestion:', suggestion.title);
      
      // Use queryClient directly instead of useQuery hook
      const cacheKey = ['amazon-product', suggestion.title, suggestion.priceRange];
      const cachedData = queryClient.getQueryData(cacheKey);
      
      if (cachedData) {
        console.log('Found cached data for:', suggestion.title);
        return cachedData as GiftSuggestion;
      }

      const amazonProduct = await getAmazonProduct(suggestion.title, suggestion.priceRange);
      
      if (amazonProduct && amazonProduct.asin) {
        console.log('Found Amazon product for:', suggestion.title);
        // Always use the original GPT-generated description
        const processedSuggestion = {
          ...suggestion,
          title: amazonProduct.title || suggestion.title,
          // Keep the original GPT description, never use Amazon's
          description: suggestion.description,
          priceRange: `${amazonProduct.currency} ${amazonProduct.price}`,
          reason: suggestion.reason || 'This item matches your requirements.',
          amazon_asin: amazonProduct.asin,
          amazon_url: amazonProduct.asin ? `https://www.amazon.com/dp/${amazonProduct.asin}` : undefined,
          amazon_price: amazonProduct.price,
          amazon_image_url: amazonProduct.imageUrl,
          amazon_rating: amazonProduct.rating,
          amazon_total_ratings: amazonProduct.totalRatings,
          search_query: suggestion.search_query || '',
        };

        // Cache the processed suggestion
        queryClient.setQueryData(cacheKey, processedSuggestion);
        
        return processedSuggestion;
      }
      
      console.log('No Amazon product found for:', suggestion.title);
      return {
        ...suggestion,
        reason: suggestion.reason || 'This item matches your requirements.',
        search_query: suggestion.search_query || '',
      };
    } catch (error) {
      console.error('Error processing suggestion:', error);
      return {
        ...suggestion,
        reason: 'This item matches your requirements.',
        search_query: suggestion.search_query || '',
      };
    }
  };

  const processSuggestions = async (suggestions: GiftSuggestion[]) => {
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      console.error('Invalid suggestions array:', suggestions);
      return [];
    }

    console.log('Processing suggestions array:', suggestions);
    return processBatch(suggestions, {
      processFn: processGiftSuggestion,
      onError: (error, suggestion) => {
        console.error('Error processing suggestion:', suggestion?.title, error);
        return suggestion;
      },
      parallel: true,
      batchSize: 4,
      staggerDelay: 250
    });
  };

  return { processSuggestions };
};