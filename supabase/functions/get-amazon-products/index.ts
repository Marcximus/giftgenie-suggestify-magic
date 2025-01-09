import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';
import { searchAmazonProduct } from './amazonApi.ts';

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');

serve(async (req) => {
  // Handle CORS
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
    
    try {
      const product = await searchAmazonProduct(searchTerm, RAPIDAPI_KEY);
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
    
    const errorResponse = {
      error: error.message || 'Failed to fetch Amazon product data',
      details: error.message || 'An unexpected error occurred'
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});