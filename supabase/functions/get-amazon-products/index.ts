import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { searchAmazonProduct } from "./amazonApi.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    const { searchTerm, priceRange } = await req.json();
    console.log('Received request for:', searchTerm, 'with price range:', priceRange);

    if (!searchTerm) {
      throw new Error('Search term is required');
    }

    const product = await searchAmazonProduct(searchTerm, apiKey);
    console.log('Product found:', product ? 'yes' : 'no');

    return new Response(
      JSON.stringify(product),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );

  } catch (error) {
    console.error('Error in get-amazon-products function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});