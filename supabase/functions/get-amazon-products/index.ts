import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { searchProducts } from "./productSearch.ts";
import { corsHeaders } from '../_shared/cors.ts';

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RAPIDAPI_KEY) {
      console.error('RAPIDAPI_KEY is not configured');
      throw new Error('RAPIDAPI_KEY is not configured');
    }

    // Log the raw request for debugging
    console.log('Raw request:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url
    });

    // Parse and validate request body
    const body = await req.json();
    console.log('Parsed request body:', body);

    if (!body || !body.searchTerm) {
      throw new Error('searchTerm is required in request body');
    }

    const { searchTerm, priceRange } = body;
    
    console.log('Processing request:', { searchTerm, priceRange });

    const product = await searchProducts(searchTerm, RAPIDAPI_KEY, priceRange);
    
    console.log('Search result:', {
      found: !!product,
      productTitle: product?.title,
      hasPrice: !!product?.price,
      hasImage: !!product?.imageUrl
    });

    return new Response(
      JSON.stringify({ 
        product,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in get-amazon-products:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }),
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