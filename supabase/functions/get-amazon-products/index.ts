import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { searchProducts } from './productSearch.ts';

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request:', req.method);
    const { searchTerm, priceRange } = await req.json();
    
    console.log('Request payload:', { searchTerm, priceRange });

    if (!searchTerm) {
      console.error('Missing search term in request');
      return new Response(
        JSON.stringify({ error: 'Search term is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!RAPIDAPI_KEY) {
      console.error('RAPIDAPI_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Clean and validate the search term
    const cleanedSearchTerm = searchTerm.trim();
    if (cleanedSearchTerm.length < 2) {
      console.error('Search term too short:', cleanedSearchTerm);
      return new Response(
        JSON.stringify({ error: 'Search term must be at least 2 characters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Search for products with the validated price range
    console.log('Starting Amazon product search with term:', cleanedSearchTerm);
    const product = await searchProducts(cleanedSearchTerm, RAPIDAPI_KEY, priceRange);
    
    console.log('Search result:', {
      found: !!product,
      title: product?.title,
      price: product?.price,
      asin: product?.asin,
      searchTerm: cleanedSearchTerm
    });

    if (!product) {
      console.log('No product found for search term:', cleanedSearchTerm);
      return new Response(
        JSON.stringify({ 
          error: 'No product found',
          searchTerm: cleanedSearchTerm 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ product }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing request:', {
      error: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.stack
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});