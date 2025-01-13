import { useAmazonProducts } from './useAmazonProducts';
import { useBatchProcessor } from './useBatchProcessor';
import { GiftSuggestion } from '@/types/suggestions';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

const BATCH_SIZE = 10;
const STAGGER_DELAY = 50;

export const useAmazonProductProcessing = () => {
  const { getAmazonProduct } = useAmazonProducts();
  const { processBatch } = useBatchProcessor<GiftSuggestion, GiftSuggestion>();
  const queryClient = useQueryClient();

  const updateSearchFrequency = async (searchTerm: string) => {
    try {
      const { data, error } = await supabase
        .from('popular_searches')
        .upsert(
          { 
            search_term: searchTerm.toLowerCase().trim(),
            frequency: 1,
            last_searched: new Date().toISOString()
          },
          {
            onConflict: 'search_term',
            ignoreDuplicates: false
          }
        )
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating search frequency:', error);
    }
  };

  const warmCache = async () => {
    try {
      const { data: popularSearches } = await supabase
        .from('popular_searches')
        .select('search_term')
        .order('frequency', { ascending: false })
        .order('last_searched', { ascending: false })
        .limit(20);

      if (popularSearches) {
        // Process popular searches in parallel with a smaller batch size
        const warmingPromises = popularSearches.map(({ search_term }) => 
          getAmazonProduct(search_term, '')
        );
        await Promise.allSettled(warmingPromises);
      }
    } catch (error) {
      console.error('Error warming cache:', error);
    }
  };

  const generateCustomDescription = async (title: string, originalDescription: string): Promise<string> => {
    try {
      const cacheKey = `description-${title.toLowerCase().trim()}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase.functions.invoke('generate-custom-description', {
        body: { title, originalDescription }
      });

      if (error) {
        console.error('Error generating custom description:', error);
        return originalDescription;
      }

      const description = data.description || originalDescription;
      localStorage.setItem(cacheKey, description);
      return description;
    } catch (error) {
      console.error('Error calling generate-custom-description:', error);
      return originalDescription;
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
        await supabase.from('api_metrics').insert({
          endpoint: 'amazon-product-processing',
          duration_ms: Math.round(performance.now() - startTime),
          status: 'success',
          cache_hit: true
        });
        return cachedData as GiftSuggestion;
      }

      // Update search frequency for cache warming
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

        await supabase.from('api_metrics').insert({
          endpoint: 'amazon-product-processing',
          duration_ms: Math.round(performance.now() - startTime),
          status: 'success',
          cache_hit: false
        });

        return processedSuggestion;
      }
      
      return suggestion;
    } catch (error) {
      console.error('Error processing suggestion:', error);
      await supabase.from('api_metrics').insert({
        endpoint: 'amazon-product-processing',
        duration_ms: Math.round(performance.now() - startTime),
        status: 'error',
        error_message: error.message,
        cache_hit: false
      });
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
      
      if (i + BATCH_SIZE < suggestions.length) {
        await new Promise(r => setTimeout(r, STAGGER_DELAY));
      }
    }
    
    return results;
  };

  return { processSuggestions };
};