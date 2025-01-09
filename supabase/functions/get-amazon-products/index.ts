import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';
import { searchAmazonProduct } from './amazonApi.ts';
import type { PriceRange } from './types.ts';

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');

function parsePriceRange(priceRange: string): PriceRange {
  try {
    if (!priceRange?.trim()) {
      console.log('No price range provided');
      return {};
    }

    // Remove currency symbols and clean the string
    const cleanRange = priceRange.replace(/[^0-9\-\.]/g, '');
    if (!cleanRange) {
      console.log('No numeric values found in price range');
      return {};
    }

    // Handle single number case
    if (!cleanRange.includes('-')) {
      const price = parseFloat(cleanRange);
      if (!isNaN(price)) {
        const min = Math.max(1, price * 0.8);
        const max = price * 1.2;
        console.log('Single price parsed as range:', { min, max });
        return { min, max };
      }
    }

    // Handle range case (e.g., "100-200")
    const [minStr, maxStr] = cleanRange.split('-');
    const min = parseFloat(minStr);
    const max = parseFloat(maxStr);
    
    if (!isNaN(min) && !isNaN(max)) {
      console.log('Price range parsed:', { min, max });
      return { min, max };
    }

    return {};
  } catch (error) {
    console.error('Error parsing price range:', error);
    return {};
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RAPIDAPI_KEY) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    const { searchTerm, priceRange } = await req.json();
    
    if (!searchTerm?.trim()) {
      throw new Error('Search term is required');
    }

    console.log('Processing request:', { searchTerm, priceRange });
    const { min, max } = parsePriceRange(priceRange);
    
    try {
      const product = await searchAmazonProduct(searchTerm, RAPIDAPI_KEY, min, max);
      console.log('Product found:', product);

      return new Response(
        JSON.stringify(product),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error searching Amazon product:', error);
      throw new Error(`Failed to search Amazon product: ${error.message}`);
    }

  } catch (error) {
    console.error('Error in get-amazon-products function:', error);
    
    const status = error.status || 500;
    const response = {
      error: error.message || 'Failed to fetch Amazon product data',
      details: error.details || error.message || 'An unexpected error occurred',
      ...(error.retryAfter && { retryAfter: error.retryAfter })
    };

    return new Response(
      JSON.stringify(response),
      {
        status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          ...(error.retryAfter && { 'Retry-After': error.retryAfter })
        }
      }
    );
  }
});