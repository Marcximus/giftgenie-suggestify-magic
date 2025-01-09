import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RAPIDAPI_KEY) {
      throw new Error('RapidAPI key not configured');
    }

    const { searchTerm } = await req.json();
    console.log('Searching Amazon for:', searchTerm);

    // Step 1: Search for products
    const searchResponse = await fetch(`https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(searchTerm)}&country=US`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    if (!searchResponse.ok) {
      throw new Error(`Amazon search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Search results received');

    if (searchData.status === 'ERROR') {
      throw new Error(searchData.error.message);
    }

    // Get the first product's ASIN
    const firstProduct = searchData.data.products[0];
    if (!firstProduct?.asin) {
      throw new Error('No products found');
    }

    // Step 2: Get detailed product information
    const detailsResponse = await fetch(`https://${RAPIDAPI_HOST}/product-details?asin=${firstProduct.asin}&country=US`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    if (!detailsResponse.ok) {
      throw new Error(`Product details failed: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();
    console.log('Product details received');

    if (detailsData.status === 'ERROR') {
      throw new Error(detailsData.error.message);
    }

    const product = detailsData.data;
    
    return new Response(
      JSON.stringify({
        title: product.title,
        description: product.description || product.feature_bullets?.join(' ') || '',
        price: product.price?.current_price || 0,
        currency: product.price?.currency || 'USD',
        imageUrl: product.main_image,
        rating: product.rating,
        totalRatings: product.ratings_total,
        asin: product.asin,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in get-amazon-products function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to fetch Amazon product data'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});