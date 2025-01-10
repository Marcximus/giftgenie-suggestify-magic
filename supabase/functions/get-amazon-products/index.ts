import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';
import { searchAmazonProduct } from './amazonApi.ts';

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');

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
      return new Response(
        JSON.stringify({ error: 'Search term is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing request:', { searchTerm, priceRange });
    
    try {
      const product = await searchAmazonProduct(searchTerm, RAPIDAPI_KEY);
      console.log('Product found:', product);

      if (!product) {
        // Return a 404 instead of 500 when no products are found
        return new Response(
          JSON.stringify({ 
            error: 'No products found',
            searchTerm,
            suggestion: 'Try a more general search term'
          }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify(product),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error searching Amazon product:', error);
      
      // Handle specific error cases
      if (error.message.includes('rate limit')) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            details: 'Please try again in a few moments'
          }),
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: 'Failed to fetch product data',
          details: error.message
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error in get-amazon-products function:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});