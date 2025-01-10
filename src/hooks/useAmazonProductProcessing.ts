import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { GiftSuggestion } from '@/types/suggestions';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from "@/components/ui/use-toast";

export const useAmazonProductProcessing = () => {
  const { getAmazonProduct } = useAmazonProducts();
  const { processBatch } = useBatchProcessor<GiftSuggestion, GiftSuggestion>();
  const queryClient = useQueryClient();

  const processGiftSuggestion = async (suggestion: GiftSuggestion): Promise<GiftSuggestion> => {
    try {
      if (!suggestion?.title || typeof suggestion.title !== 'string') {
        console.error('Invalid suggestion title:', suggestion);
        return {
          title: 'Untitled Product',
          description: suggestion?.description || 'No description available',
          priceRange: suggestion?.priceRange || 'Price unavailable',
          reason: suggestion?.reason || 'This item matches your requirements.',
          search_query: suggestion?.search_query || '',
        };
      }

      // Clean up the title by removing quotes if present
      const cleanTitle = suggestion.title.replace(/^["']|["']$/g, '');
      console.log('Processing suggestion:', cleanTitle);
      
      // Use queryClient for caching
      const cacheKey = ['amazon-product', cleanTitle, suggestion.priceRange];
      const cachedData = queryClient.getQueryData(cacheKey);
      
      if (cachedData) {
        console.log('Found cached data for:', cleanTitle);
        return cachedData as GiftSuggestion;
      }

      const amazonProduct = await getAmazonProduct(cleanTitle, suggestion.priceRange);
      
      if (amazonProduct && amazonProduct.asin) {
        console.log('Found Amazon product for:', cleanTitle);
        const processedSuggestion = {
          ...suggestion,
          title: amazonProduct.title || cleanTitle,
          description: suggestion.description || amazonProduct.description || 'No description available',
          priceRange: `${amazonProduct.currency} ${amazonProduct.price}`,
          reason: suggestion.reason || 'This item matches your requirements.',
          amazon_asin: amazonProduct.asin,
          amazon_url: `https://www.amazon.com/dp/${amazonProduct.asin}`,
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
      
      console.log('No Amazon product found for:', cleanTitle);
      toast({
        title: "Product not found",
        description: `Could not find Amazon product for: ${cleanTitle}`,
        variant: "destructive",
      });

      return {
        ...suggestion,
        title: cleanTitle,
        description: suggestion.description || 'No description available',
        priceRange: suggestion.priceRange || 'Price unavailable',
        reason: suggestion.reason || 'This item matches your requirements.',
        search_query: suggestion.search_query || '',
      };
    } catch (error) {
      console.error('Error processing suggestion:', error);
      toast({
        title: "Error processing product",
        description: "There was an error processing this product. Please try again.",
        variant: "destructive",
      });

      return {
        ...suggestion,
        title: suggestion.title.replace(/^["']|["']$/g, ''),
        description: suggestion.description || 'No description available',
        priceRange: suggestion.priceRange || 'Price unavailable',
        reason: 'This item matches your requirements.',
        search_query: suggestion.search_query || '',
      };
    }
  };

  const processSuggestions = async (suggestions: GiftSuggestion[]) => {
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      console.error('Invalid suggestions array:', suggestions);
      toast({
        title: "No suggestions found",
        description: "Could not generate gift suggestions. Please try again.",
        variant: "destructive",
      });
      return [];
    }

    // Clean up suggestions array by removing any string literals
    const cleanedSuggestions = suggestions.map(suggestion => {
      if (typeof suggestion === 'string') {
        try {
          return JSON.parse(suggestion);
        } catch {
          return {
            title: suggestion,
            description: 'No description available',
            priceRange: 'Price unavailable',
            reason: 'This item matches your requirements.',
            search_query: '',
          };
        }
      }
      return suggestion;
    });

    console.log('Processing suggestions array:', cleanedSuggestions);
    return processBatch(cleanedSuggestions, {
      processFn: processGiftSuggestion,
      onError: (error, suggestion) => {
        console.error('Error processing suggestion:', suggestion?.title, error);
        return {
          title: suggestion?.title || 'Untitled Product',
          description: suggestion?.description || 'No description available',
          priceRange: suggestion?.priceRange || 'Price unavailable',
          reason: suggestion?.reason || 'This item matches your requirements.',
          search_query: suggestion?.search_query || '',
        };
      },
      parallel: true,
      batchSize: 4,
      staggerDelay: 250
    });
  };

  return { processSuggestions };
};