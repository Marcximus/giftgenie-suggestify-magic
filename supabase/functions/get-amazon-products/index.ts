import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { searchAmazonProduct } from "./amazonApi.ts";
import { isRateLimited, logRequest } from "../_shared/rate-limiter.ts";

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

    // Check rate limiting
    if (isRateLimited()) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: 30,
        }),
        { 
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': '30',
          },
        }
      );
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

    // Log the request for rate limiting
    logRequest();

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
    
    // Handle rate limit errors specifically
    if (error.message?.includes('429')) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: 30,
        }),
        { 
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': '30',
          },
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
      }),
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