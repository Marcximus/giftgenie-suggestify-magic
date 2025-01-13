import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./config.ts";
import { searchAmazonProduct } from "./amazonApi.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm, priceRange } = await req.json();
    const apiKey = Deno.env.get('RAPIDAPI_KEY');

    if (!apiKey) {
      throw new Error('RapidAPI key not configured');
    }

    console.log('Searching Amazon for:', searchTerm, { priceRange });
    const product = await searchAmazonProduct(searchTerm, apiKey);

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
      JSON.stringify({ error: error.message }),
      { 
        status: error.status || 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});