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

const parsePriceRange = (priceRange: string): { min: number; max: number } | null => {
  try {
    // Remove currency symbols and clean up
    const cleanRange = priceRange.replace(/[^0-9\-\.]/g, '');
    console.log('Parsing price range:', { original: priceRange, cleaned: cleanRange });
    
    // Handle hyphen-separated range (e.g., "20-50")
    if (cleanRange.includes('-')) {
      const [min, max] = cleanRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
        console.log('Successfully parsed range:', { min, max });
        return { min, max };
      }
    }
    
    // Handle single number (e.g., "around 30")
    const singlePrice = parseFloat(cleanRange);
    if (!isNaN(singlePrice) && singlePrice > 0) {
      // Use 20% variance for single prices
      const min = Math.floor(singlePrice * 0.8);
      const max = Math.ceil(singlePrice * 1.2);
      console.log('Using price variance:', { original: singlePrice, min, max });
      return { min, max };
    }

    console.log('Failed to parse price range:', priceRange);
    return null;
  } catch (error) {
    console.error('Error parsing price range:', error);
    return null;
  }
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
    console.log('Starting Amazon search with:', { searchTerm, priceRange });
    
    const searchParams = new URLSearchParams({
      query: cleanSearchTerm(searchTerm),
      country: 'US',
      category_id: 'aps',
      sort_by: 'RELEVANCE',
      page: '1',
      results_per_page: '20' // Request more results to ensure we have enough after filtering
    });

    // Add price range parameters if provided
    if (priceRange) {
      const parsedRange = parsePriceRange(priceRange);
      if (parsedRange) {
        console.log('Adding price constraints:', parsedRange);
        // Convert to cents to match Amazon API format
        const minPriceCents = Math.floor(parsedRange.min * 100);
        const maxPriceCents = Math.ceil(parsedRange.max * 100);
        searchParams.append('min_price', minPriceCents.toString());
        searchParams.append('max_price', maxPriceCents.toString());
      }
    }

    console.log('Making request to Amazon API with params:', searchParams.toString());

    const { data, error } = await supabase.functions.invoke('get-amazon-products', {
      body: { 
        searchTerm: cleanSearchTerm(searchTerm),
        priceRange,
        searchParams: Object.fromEntries(searchParams)
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
          priceRange,
          searchParams: Object.fromEntries(searchParams)
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