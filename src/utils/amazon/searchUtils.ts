import { supabase } from "@/integrations/supabase/client";
import type { AmazonProduct } from './types';

const cleanSearchTerm = (searchTerm: string): string => {
  return searchTerm
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/&/g, 'and') // Replace & with 'and'
    .replace(/[^\w\s-]/g, ' ') // Remove special characters except hyphens
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

export const simplifySearchTerm = (searchTerm: string): string => {
  const genericSearchTerm = searchTerm
    .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
    .replace(/\b(?:edition|version|series)\b/gi, '') // Remove common suffixes
    .replace(/-.*$/, '') // Remove anything after a hyphen
    .replace(/\d+(?:\s*-\s*\d+)?\s*(?:gb|tb|inch|"|cm|mm)/gi, '') // Remove sizes
    .trim();

  return genericSearchTerm;
};

export const getFallbackSearchTerms = (searchTerm: string): string[] => {
  const words = searchTerm.split(' ')
    .filter(word => !['with', 'and', 'in', 'for', 'by', 'the', 'a', 'an'].includes(word.toLowerCase()))
    .filter(word => word.length > 2);
  
  const searchTerms = [];
  
  if (words.length > 2) {
    searchTerms.push(words.slice(0, 3).join(' '));
    searchTerms.push([words[0], words[words.length - 1]].join(' '));
  } else {
    searchTerms.push(words.join(' '));
  }
  
  return [...new Set(searchTerms)];
};

export const searchWithFallback = async (
  searchTerm: string,
  priceRange: string
): Promise<AmazonProduct | null> => {
  try {
    console.log('Searching with term:', searchTerm);
    
    const { data, error } = await supabase.functions.invoke('get-amazon-products', {
      body: { 
        searchTerm: cleanSearchTerm(searchTerm),
        priceRange 
      }
    });

    if (error) {
      console.error('Error in searchWithFallback:', error);
      throw error;
    }

    if (!data?.product) {
      console.log('No product found, trying simplified search');
      const simplifiedTerm = simplifySearchTerm(searchTerm);
      
      const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke('get-amazon-products', {
        body: { 
          searchTerm: simplifiedTerm,
          priceRange 
        }
      });

      if (fallbackError) throw fallbackError;
      if (!fallbackData?.product) return null;
      
      return fallbackData.product;
    }

    return data.product;
  } catch (error) {
    console.error('Error in searchWithFallback:', error);
    throw error;
  }
};