import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { GiftSuggestion } from '@/types/suggestions';
import { useQueryClient } from '@tanstack/react-query';
import { updateSearchFrequency, getPopularSearches } from '@/utils/searchFrequencyUtils';
import { generateCustomDescription } from '@/utils/descriptionUtils';
import { logApiMetrics } from '@/utils/metricsUtils';
import { toast } from "@/components/ui/use-toast";

const BATCH_SIZE = 4;
const STAGGER_DELAY = 2000;

const simplifySearchTerm = (title: string): string => {
  return title
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/\s*-\s*.*$/, '') // Remove everything after a dash
    .replace(/(?:version|edition|model|type|style|color).*$/i, '') // Remove version/edition info
    .replace(/\b(?:with|featuring|includes?|plus)\b.*$/i, '') // Remove additional features
    .replace(/\s+/g, ' ') // Replace multiple spaces
    .trim();
};

const generateSearchVariations = (title: string): string[] => {
  const simplified = simplifySearchTerm(title);
  const words = simplified.split(' ').filter(word => word.length > 2);
  const variations = [simplified];
  
  // Add first 3 words if we have enough
  if (words.length >= 3) {
    variations.push(words.slice(0, 3).join(' '));
  }
  
  // Add first and last word if different
  if (words.length >= 2) {
    variations.push(`${words[0]} ${words[words.length - 1]}`);
  }
  
  // Add just the first word if it's meaningful
  if (words[0]?.length > 3) {
    variations.push(words[0]);
  }
  
  return [...new Set(variations)]; // Remove duplicates
};

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

      await updateSearchFrequency(suggestion.title);
      console.log('Processing suggestion:', suggestion.title);
      
      const customDescription = await generateCustomDescription(
        suggestion.title,
        suggestion.description
      );

      // Try different search variations until we find a product
      const searchVariations = generateSearchVariations(suggestion.title);
      let amazonProduct = null;
      
      for (const searchTerm of searchVariations) {
        console.log('Trying search variation:', searchTerm);
        try {
          // Add delay between attempts
          await new Promise(resolve => setTimeout(resolve, 1000));
          amazonProduct = await getAmazonProduct(searchTerm, suggestion.priceRange);
          if (amazonProduct?.asin) {
            console.log('Found product with search term:', searchTerm);
            break;
          }
        } catch (error) {
          console.log('Search failed for variation:', searchTerm, error);
          if (error.status === 429) throw error; // Re-throw rate limit errors
          // Continue to next variation for other errors
        }
      }
      
      if (amazonProduct?.asin) {
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
      
      // If no product found after all variations, return original suggestion
      console.log('No product found for any variation of:', suggestion.title);
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
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      }
      
      await logApiMetrics('amazon-product-processing', startTime, 'error', error.message);
      return suggestion;
    }
  };

  const processSuggestions = async (suggestions: GiftSuggestion[]) => {
    console.log('Processing suggestions sequentially');
    const results: GiftSuggestion[] = [];
    
    for (const suggestion of suggestions) {
      try {
        const result = await processGiftSuggestion(suggestion);
        results.push(result);
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