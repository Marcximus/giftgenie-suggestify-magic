import { supabase } from "@/integrations/supabase/client";
import type { AmazonProduct } from './types';
import { Database } from '@/integrations/supabase/types';

type AmazonCacheRow = Database['public']['Tables']['amazon_product_cache']['Row'];

export const getCachedProduct = async (searchTerm: string, priceRange?: string): Promise<AmazonProduct | null> => {
  try {
    const { data, error } = await supabase
      .from('amazon_product_cache')
      .select('*')
      .eq('search_term', searchTerm.toLowerCase())
      .eq('price_range', priceRange || '')
      .single();

    if (error) throw error;
    
    if (data) {
      // Update last_accessed and hit_count
      const cacheRow = data as AmazonCacheRow;
      await supabase
        .from('amazon_product_cache')
        .update({
          last_accessed: new Date().toISOString(),
          hit_count: (cacheRow.hit_count || 0) + 1
        })
        .eq('search_term', searchTerm.toLowerCase())
        .eq('price_range', priceRange || '');

      // Safely cast the stored JSON data to AmazonProduct
      const productData = cacheRow.product_data as unknown as AmazonProduct;
      return productData;
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
    const cacheEntry = {
      search_term: searchTerm.toLowerCase(),
      price_range: priceRange || '',
      product_data: product as unknown as Json,
      last_accessed: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    await supabase
      .from('amazon_product_cache')
      .upsert(cacheEntry, {
        onConflict: 'search_term,price_range'
      });
  } catch (error) {
    console.error('Error caching product:', error);
  }
};