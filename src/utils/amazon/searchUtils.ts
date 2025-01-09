import { supabase } from "@/integrations/supabase/client";
import { AmazonProduct } from './types';
import { toast } from "@/components/ui/use-toast";

export const trySearchWithTerm = async (searchTerm: string, priceRange: string): Promise<AmazonProduct | null> => {
  console.log('Attempting search with term:', searchTerm);
  const response = await supabase.functions.invoke('get-amazon-products', {
    body: { searchTerm, priceRange }
  });

  if (!response.error) {
    return response.data;
  }

  // If it's a 404, we want to propagate this error as it means no products were found
  if (response.error.status === 404) {
    throw response.error;
  }

  throw response.error;
};

export const searchWithFallback = async (searchTerm: string, priceRange: string): Promise<AmazonProduct | null> => {
  try {
    // Try with full search term first
    let product = await trySearchWithTerm(searchTerm, priceRange);
    
    // If no product found and search term has more than 3 words, try with first 3 words
    if (!product) {
      const words = searchTerm.split(' ');
      if (words.length > 3) {
        const simplifiedSearch = words.slice(0, 3).join(' ');
        console.log('No products found, attempting simplified search with:', simplifiedSearch);
        product = await trySearchWithTerm(simplifiedSearch, priceRange);
      }
    }

    // If still no product found, try with just the first two words
    if (!product) {
      const words = searchTerm.split(' ');
      if (words.length > 2) {
        const briefSearch = words.slice(0, 2).join(' ');
        console.log('Still no products found, attempting brief search with:', briefSearch);
        product = await trySearchWithTerm(briefSearch, priceRange);
      }
    }

    // If no product found after all attempts, show a toast
    if (!product) {
      toast({
        title: "No products found",
        description: "Try searching with a more general term",
        variant: "destructive",
      });
      return null;
    }

    return product;
  } catch (error: any) {
    // If it's a 404, we want to show the "no products found" toast
    if (error.status === 404) {
      toast({
        title: "No products found",
        description: "Try searching with a more general term",
        variant: "destructive",
      });
      return null;
    }
    throw error;
  }
};