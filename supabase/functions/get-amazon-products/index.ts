import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';
import type { ProductResponse } from './types.ts';

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

// Helper to parse price range and return min/max values
const parsePriceRange = (priceRange: string): { min?: number; max?: number } => {
  const cleanRange = priceRange.toLowerCase().replace(/[$usd]/g, '').trim();
  
  if (cleanRange.includes('under')) {
    const max = parseFloat(cleanRange.replace('under', ''));
    return { max };
  }
  
  if (cleanRange.includes('over')) {
    const min = parseFloat(cleanRange.replace('over', ''));
    return { min };
  }
  
  if (cleanRange.includes('-')) {
    const [min, max] = cleanRange.split('-').map(p => parseFloat(p.trim()));
    return { min, max };
  }
  
  const singlePrice = parseFloat(cleanRange);
  if (!isNaN(singlePrice)) {
    return { max: singlePrice * 1.2 };
  }
  
  return {};
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

    const { searchTerm, priceRange } = await req.json();
    console.log('Processing request for search term:', searchTerm, 'Price range:', priceRange);
    
    // Parse price range to get min/max values
    const { min, max } = parsePriceRange(priceRange);
    console.log('Parsed price range:', { min, max });

    // Build search URL with all parameters at once
    const searchParams = new URLSearchParams({
      query: searchTerm,
      country: 'US',
      sort_by: 'BEST_SELLERS', // Changed to get best-selling items first
    });

    // Add optional price filters
    if (min !== undefined) searchParams.append('min_price', min.toString());
    if (max !== undefined) searchParams.append('max_price', max.toString());

    // Additional filters for better results
    searchParams.append('is_prime', 'true');
    searchParams.append('four_stars_and_up', 'true');

    const searchUrl = `https://${RAPIDAPI_HOST}/search?${searchParams.toString()}`;
    console.log('Search URL:', searchUrl);

    const response = await fetch(searchUrl, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    });

    if (!response.ok) {
      console.error('Amazon search failed with status:', response.status);
      throw new Error(`Amazon search failed: ${response.status}`);
    }

    const searchData = await response.json();
    console.log('Search response received');

    if (!searchData.data?.products?.[0]) {
      throw new Error('No products found');
    }

    // Extract data directly from search results
    const product = searchData.data.products[0];
    const productData: ProductResponse = {
      title: product.title,
      description: product.product_description || product.title,
      price: parseFloat(product.price?.current_price || '0'),
      currency: product.price?.currency || 'USD',
      imageUrl: product.product_photo || product.thumbnail,
      rating: parseFloat(product.product_star_rating || '0'),
      totalRatings: parseInt(product.product_num_ratings || '0', 10),
      asin: product.asin,
    };

    console.log('Returning product data:', productData);

    return new Response(JSON.stringify(productData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in get-amazon-products function:', error);
    
    if (error.message.includes('rate limit')) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.',
          retryAfter: '30'
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '30'
          }
        }
      );
    }

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