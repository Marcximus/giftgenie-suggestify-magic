import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { searchProducts } from './productSearch.ts';

console.log('Loading get-amazon-products function...');

serve(async (req) => {
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
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Vary': 'Origin'
      },
    });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error(`Method ${req.method} not allowed`);
    }

    const { searchTerm } = await req.json();
    const apiKey = Deno.env.get('RAPIDAPI_KEY');

    console.log('Processing request with:', {
      searchTerm,
      hasApiKey: !!apiKey,
      apiKeyFirstChars: apiKey ? apiKey.substring(0, 4) : 'missing'
    });

    if (!apiKey) {
      console.error('RAPIDAPI_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'API configuration error',
          details: 'RapidAPI key is not configured',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 500,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Vary': 'Origin'
          }
        }
      );
    }

    console.log('Starting product search for term:', searchTerm);
    
    const product = await searchProducts(searchTerm, apiKey);
    
    if (!product) {
      console.log('No products found for search term:', searchTerm);
      return new Response(
        JSON.stringify({ 
          error: 'No products found',
          details: 'No matching products found for the search term',
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Vary': 'Origin'
          },
          status: 404
        }
      );
    }

    console.log('Product search successful:', {
      title: product.title,
      asin: product.asin,
      hasPrice: !!product.price,
      hasImage: !!product.imageUrl
    });

    return new Response(
      JSON.stringify({ product }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Vary': 'Origin'
        }
      }
    );

  } catch (error) {
    console.error('Error in get-amazon-products function:', error);
    console.error('Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch product details',
        details: error.message,
        timestamp: new Date().toISOString(),
        origin: req.headers.get('origin'),
        method: req.method
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Vary': 'Origin'
        }
      }
    );
  }
});