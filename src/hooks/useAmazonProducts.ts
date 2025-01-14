import { useState } from 'react';
import { AmazonProduct } from '@/utils/amazon/types';
import { AMAZON_CONFIG } from '@/utils/amazon/config';
import { ProductSearchService } from '@/utils/amazon/productSearch';
import { getCachedProduct, cacheProduct } from '@/utils/amazon/cacheUtils';
import { toast } from "@/components/ui/use-toast";

export const useAmazonProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const productSearchService = ProductSearchService.getInstance();

  const getAmazonProduct = async (searchTerm: string, priceRange: string): Promise<AmazonProduct | null> => {
    try {
      const cacheKey = `${searchTerm}-${priceRange}`;
      const cached = getCachedProduct<AmazonProduct>(cacheKey);
      if (cached) return cached;

      setIsLoading(true);
      const searchData = await productSearchService.searchProduct(
        searchTerm,
        AMAZON_CONFIG.API_KEY,
        AMAZON_CONFIG.RAPID_API_HOST
      );

      if (searchData?.data?.products?.[0]) {
        const product = searchData.data.products[0];
        const amazonProduct: AmazonProduct = {
          title: product.title,
          description: product.product_description || product.title,
          price: product.price?.current_price,
          currency: product.price?.currency || 'USD',
          imageUrl: product.product_photo || product.thumbnail,
          rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
          totalRatings: product.product_num_ratings ? parseInt(product.product_num_ratings, 10) : undefined,
          asin: product.asin,
        };

        cacheProduct(cacheKey, amazonProduct);
        return amazonProduct;
      }

      return null;
    } catch (error: any) {
      console.error('Error getting Amazon product:', error);
      
      if (error.message.includes('Max retries exceeded')) {
        toast({
          title: "Too many requests",
          description: "Please wait a moment before trying again",
          variant: "destructive",
        });
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getAmazonProduct,
    isLoading
  };
};