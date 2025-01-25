import { supabase } from "@/integrations/supabase/client";
import type { AmazonProduct } from './types';

export const getCachedProduct = async (searchTerm: string, priceRange?: string): Promise<AmazonProduct | null> => {
  try {
    const { data, error } = await supabase
      .from('amazon_product_cache')
      .select('product_data')
      .eq('search_term', searchTerm.toLowerCase())
      .eq('price_range', priceRange || '')
      .single();

    if (error) throw error;
    
    if (data) {
      // Update last_accessed and hit_count
      await supabase
        .from('amazon_product_cache')
        .update({
          last_accessed: new Date().toISOString(),
          hit_count: data.hit_count + 1
        })
        .eq('search_term', searchTerm.toLowerCase())
        .eq('price_range', priceRange || '');

      return data.product_data as AmazonProduct;
    }

    return null;
  } catch (error) {
    console.error('Error getting cached product:', error);
    return null;
  }
};

export const cacheProduct = async (
  searchTerm: string, 
  product: AmazonProduct, 
  priceRange?: string
): Promise<void> => {
  try {
    await supabase
      .from('amazon_product_cache')
      .upsert({
        search_term: searchTerm.toLowerCase(),
        price_range: priceRange || '',
        product_data: product,
        last_accessed: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }, {
        onConflict: 'search_term,price_range'
      });
  } catch (error) {
    console.error('Error caching product:', error);
  }
};