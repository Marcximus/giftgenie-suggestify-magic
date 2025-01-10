import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { GiftSuggestion } from '@/types/suggestions';

export const useAmazonProductProcessing = () => {
  const { getAmazonProduct } = useAmazonProducts();
  const { processBatch } = useBatchProcessor<GiftSuggestion, GiftSuggestion>();

  const processGiftSuggestion = async (suggestion: GiftSuggestion): Promise<GiftSuggestion> => {
    try {
      console.log('Processing suggestion:', suggestion.title);
      const amazonProduct = await getAmazonProduct(suggestion.title, suggestion.priceRange);
      
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
      }
    });
  };

  return { processSuggestions };
};