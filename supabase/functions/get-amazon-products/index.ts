import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { searchAmazonProduct } from './amazonApi.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm, priceRange } = await req.json();
    console.log('Received request for search term:', searchTerm);

    if (!searchTerm) {
      throw new Error('Search term is required');
    }

    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    // Set a timeout for the request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000);
    });

    const searchPromise = searchAmazonProduct(searchTerm, apiKey, priceRange);
    const product = await Promise.race([searchPromise, timeoutPromise]);

    if (!product) {
      console.log('No product found for search term:', searchTerm);
      return new Response(
        JSON.stringify({ error: 'No product found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log('Found product:', product);
    return new Response(
      JSON.stringify({ product }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-amazon-products:', error);
    const status = error.message.includes('RAPIDAPI_KEY') ? 503 : 500;
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status 
      }
    );
  }
});