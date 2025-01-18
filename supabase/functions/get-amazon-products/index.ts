import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { searchProducts } from './productSearch.ts';

console.log('Loading get-amazon-products function...');

serve(async (req) => {
  // Add CORS headers to all responses
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  };

  try {
    // Log incoming request details
    console.log('Received request:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log('Handling OPTIONS request');
      return new Response(null, {
        status: 204,
        headers
      });
    }

    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    const requestData = await req.json();
    console.log('Request payload:', requestData);

    const { searchTerm } = requestData;
    if (!searchTerm || typeof searchTerm !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          details: 'Search term is required and must be a string',
        }),
        {
          status: 400,
          headers
        }
      );
    }

    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      console.error('RAPIDAPI_KEY not configured');
      return new Response(
        JSON.stringify({
          error: 'Configuration error',
          details: 'API key not configured',
        }),
        {
          status: 500,
          headers
        }
      );
    }

    console.log('Starting product search with term:', searchTerm);
    
    // Set a timeout for the product search
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000);
    });

    // Race between the product search and the timeout
    const product = await Promise.race([
      searchProducts(searchTerm, apiKey),
      timeoutPromise
    ]);

    if (!product) {
      console.log('No products found for search term:', searchTerm);
      return new Response(
        JSON.stringify({
          error: 'Not found',
          details: 'No matching products found',
        }),
        {
          status: 404,
          headers
        }
      );
    }

    console.log('Product search successful:', {
      title: product.title,
      asin: product.asin,
    });

    return new Response(
      JSON.stringify({ product }),
      {
        status: 200,
        headers
      }
    );

  } catch (error) {
    console.error('Error in get-amazon-products function:', {
      error: error.message,
      stack: error.stack,
      type: error.name,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        type: error.name,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers
      }
    );
  }
});