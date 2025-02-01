import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { searchProducts, buildSearchUrl } from './searchUtils.ts';
import { extractPriceRange } from './priceUtils.ts';
import { corsHeaders } from './searchUtils.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request:', req.method);
    const { searchTerm, priceRange: rawPriceRange } = await req.json();
    
    console.log('Request payload:', { searchTerm, priceRange: rawPriceRange });

    if (!searchTerm) {
      console.error('Missing search term in request');
      return new Response(
        JSON.stringify({ error: 'Search term is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      console.error('RAPIDAPI_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract and validate price range
    const priceRange = rawPriceRange ? extractPriceRange(rawPriceRange) : undefined;
    console.log('Extracted price range:', priceRange);

    // Search for products with the validated price range
    const products = await searchProducts([searchTerm], apiKey, priceRange);
    
    if (!products.length) {
      console.log('No products found for search term:', searchTerm);
      return new Response(
        JSON.stringify({ product: null }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Successfully found product:', products[0]);
    return new Response(
      JSON.stringify({ product: products[0] }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing request:', {
      error: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.stack
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});