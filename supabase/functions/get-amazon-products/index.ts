import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { searchProducts } from './productSearch.ts';

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
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
    const contentType = req.headers.get('content-type');
    
    try {
      // Ensure we're dealing with JSON content
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Content-Type must be application/json');
      }
      
      const rawBody = await req.text();
      console.log('Raw request body:', rawBody);
      
      if (!rawBody) {
        throw new Error('Request body is empty');
      }
      
      requestBody = JSON.parse(rawBody);
      console.log('Parsed request body:', requestBody);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({
          error: 'Invalid request body',
          details: error.message,
          receivedContentType: contentType
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

    // Validate required fields
    const { searchTerm, priceRange } = requestBody || {};
    
    if (!searchTerm || typeof searchTerm !== 'string' || !searchTerm.trim()) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request: searchTerm is required and must be a non-empty string',
          receivedValue: searchTerm
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