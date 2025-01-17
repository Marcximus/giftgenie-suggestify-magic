import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { searchProducts } from './productSearch.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm } = await req.json();
    const apiKey = Deno.env.get('RAPIDAPI_KEY');

    if (!apiKey) {
      console.error('RAPIDAPI_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'API configuration error',
          details: 'RapidAPI key is not configured'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Starting product search for term:', searchTerm);
    console.log('API Key length:', apiKey.length);
    console.log('API Key first 4 chars:', apiKey.substring(0, 4));
    
    const product = await searchProducts(searchTerm, apiKey);
    
    if (!product) {
      console.log('No products found for search term:', searchTerm);
      return new Response(
        JSON.stringify({ 
          error: 'No products found',
          details: 'No matching products found for the search term'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    console.log('Product search successful:', {
      title: product.title,
      asin: product.asin,
      hasPrice: !!product.price,
      hasImage: !!product.imageUrl,
      imageUrl: product.imageUrl // Log the actual URL for debugging
    });

    return new Response(
      JSON.stringify({ product }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-amazon-products function:', error);
    console.error('Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch product details',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});