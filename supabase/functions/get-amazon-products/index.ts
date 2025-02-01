import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { searchProducts } from './productSearch.ts';

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url
    });

    // Validate API key
    if (!RAPIDAPI_KEY) {
      console.error('RAPIDAPI_KEY is not configured');
      throw new Error('RAPIDAPI_KEY is not configured');
    }

    // Parse and validate request body
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      
      if (!bodyText) {
        throw new Error('Request body is empty');
      }
      
      requestBody = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      throw new Error(`Invalid request body: ${parseError.message}`);
    }

    console.log('Parsed request body:', requestBody);

    const { searchTerm, priceRange } = requestBody;

    if (!searchTerm) {
      throw new Error('searchTerm is required');
    }

    console.log('Processing search request:', {
      searchTerm,
      priceRange,
      timestamp: new Date().toISOString()
    });

    const product = await searchProducts(searchTerm, RAPIDAPI_KEY, priceRange);
    
    console.log('Search completed:', {
      searchTerm,
      found: !!product,
      productTitle: product?.title,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ product }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );

  } catch (error) {
    console.error('Error processing request:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
        timestamp: new Date().toISOString()
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