import { supabase } from "@/integrations/supabase/client";
import { AmazonProduct } from './types';
import { toast } from "@/components/ui/use-toast";

const cleanSearchTerm = (term: string): string => {
  // Remove specific model numbers, sizes, and colors
  return term
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/with.*$/i, '') // Remove "with..." descriptions
    .replace(/in \w+(?:\s+\w+)*$/, '') // Remove color descriptions
    .replace(/\d+(?:\s*-\s*\d+)?\s*(?:gb|tb|inch|"|cm|mm)/gi, '') // Remove sizes
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

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
    
    // If no product found, try with cleaned search term
    if (!product) {
      const cleanedSearch = cleanSearchTerm(searchTerm);
      if (cleanedSearch !== searchTerm) {
        console.log('No products found, attempting with cleaned search term:', cleanedSearch);
        product = await trySearchWithTerm(cleanedSearch, priceRange);
      }
    }

    // If still no product, try with first two significant words
    if (!product) {
      const words = cleanSearchTerm(searchTerm)
        .split(' ')
        .filter(word => word.length > 2); // Filter out small words like "in", "of", etc
      
      if (words.length > 1) {
        const briefSearch = words.slice(0, 2).join(' ');
        console.log('Still no products found, attempting brief search with:', briefSearch);
        product = await trySearchWithTerm(briefSearch, priceRange);
      }
    }

    // If still no product, try with just the first significant word
    if (!product && searchTerm.split(' ').length > 1) {
      const firstWord = cleanSearchTerm(searchTerm)
        .split(' ')
        .filter(word => word.length > 2)[0];
      
      if (firstWord) {
        console.log('Final attempt with single word:', firstWord);
        product = await trySearchWithTerm(firstWord, priceRange);
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