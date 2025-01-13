import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { GiftSuggestion } from '@/types/suggestions';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

export const useAmazonProductProcessing = () => {
  const { getAmazonProduct } = useAmazonProducts();
  const { processBatch } = useBatchProcessor<GiftSuggestion, GiftSuggestion>();
  const queryClient = useQueryClient();

  const generateCustomDescription = async (title: string, originalDescription: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-custom-description', {
        body: { title, originalDescription }
      });

      if (error) {
        console.error('Error generating custom description:', error);
        return originalDescription;
      }

      return data.description || originalDescription;
    } catch (error) {
      console.error('Error calling generate-custom-description:', error);
      return originalDescription;
    }
  };

  const processGiftSuggestion = async (suggestion: GiftSuggestion): Promise<GiftSuggestion> => {
    try {
      // Use queryClient directly for caching
      const cacheKey = ['amazon-product', suggestion.title, suggestion.priceRange];
      const cachedData = queryClient.getQueryData(cacheKey);
      
      if (cachedData) {
        console.log('Cache hit for:', suggestion.title);
        return cachedData as GiftSuggestion;
      }

      console.log('Processing suggestion:', suggestion.title);
      const amazonProduct = await getAmazonProduct(suggestion.title, suggestion.priceRange);
      
      if (amazonProduct && amazonProduct.asin) {
        // Generate custom description in parallel with product fetching
        const [customDescription] = await Promise.all([
          generateCustomDescription(
            amazonProduct.title || suggestion.title,
            suggestion.description
          )
        ]);

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

        // Cache the processed suggestion
        queryClient.setQueryData(cacheKey, processedSuggestion);
        return processedSuggestion;
      }
      
      return suggestion;
    } catch (error) {
      console.error('Error processing suggestion:', error);
      return suggestion;
    }
  };

  const processSuggestions = async (suggestions: GiftSuggestion[]) => {
    // Process suggestions in parallel with a maximum batch size
    const results = await Promise.all(
      suggestions.map(suggestion => processGiftSuggestion(suggestion))
    );
    return results;
  };

  return { processSuggestions };
};