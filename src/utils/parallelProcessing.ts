import { supabase } from "@/integrations/supabase/client";
import { getProductCache, setProductCache } from "./cacheUtils";
import { GiftSuggestion } from "@/types/suggestions";

export const processProductsInParallel = async (suggestions: GiftSuggestion[]) => {
  const batchSize = 3; // Process 3 products at a time to avoid rate limits
  const results: GiftSuggestion[] = [];
  
  for (let i = 0; i < suggestions.length; i += batchSize) {
    const batch = suggestions.slice(i, i + batchSize);
    const batchPromises = batch.map(async (suggestion) => {
      const cacheKey = `product_${suggestion.title}`;
      const cachedProduct = await getProductCache(cacheKey);
      
      if (cachedProduct) {
        console.log('Using cached product:', suggestion.title);
        return cachedProduct;
      }

      try {
        const { data: productData, error } = await supabase.functions.invoke('get-amazon-products', {
          body: { searchQuery: suggestion.title }
        });

        if (error) throw error;
        
        const enrichedProduct = {
          ...suggestion,
          ...productData
        };
        
        await setProductCache(cacheKey, enrichedProduct);
        return enrichedProduct;
      } catch (error) {
        console.error('Error processing product:', error);
        return suggestion;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add a small delay between batches to respect rate limits
    if (i + batchSize < suggestions.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
};