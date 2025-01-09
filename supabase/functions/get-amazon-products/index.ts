import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';
import type { ProductResponse } from './types.ts';

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

// Helper to parse price range and return min/max values
const parsePriceRange = (priceRange: string): { min?: number; max?: number } => {
  try {
    console.log('Parsing price range:', priceRange);
    const cleanRange = priceRange.toLowerCase().replace(/[$usd\s]/g, '').trim();
    
    if (cleanRange.includes('under')) {
      const max = parseFloat(cleanRange.replace('under', ''));
      console.log('Parsed under price range:', { max });
      return isNaN(max) ? {} : { max };
    }
    
    if (cleanRange.includes('over')) {
      const min = parseFloat(cleanRange.replace('over', ''));
      console.log('Parsed over price range:', { min });
      return isNaN(min) ? {} : { min };
    }
    
    if (cleanRange.includes('-')) {
      const [minStr, maxStr] = cleanRange.split('-').map(p => p.trim());
      const min = parseFloat(minStr);
      const max = parseFloat(maxStr);
      console.log('Parsed range price range:', { min, max });
      return {
        ...(isNaN(min) ? {} : { min }),
        ...(isNaN(max) ? {} : { max })
      };
    }
    
    const singlePrice = parseFloat(cleanRange);
    if (!isNaN(singlePrice)) {
      // For a single price, set a range of ±20%
      const min = Math.max(0, singlePrice * 0.8);
      const max = singlePrice * 1.2;
      console.log('Parsed single price range:', { min, max });
      return { min, max };
    }
    
    console.log('Could not parse price range, returning empty constraints');
    return {};
  } catch (error) {
    console.error('Error parsing price range:', error);
    return {};
  }
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
    console.log('Processing request:', { searchTerm, priceRange });
    
    // Parse price range to get min/max values
    const { min, max } = parsePriceRange(priceRange);
    console.log('Parsed price constraints:', { min, max });

    // Build search URL with all parameters
    const searchParams = new URLSearchParams({
      query: searchTerm,
      country: 'US',
      sort_by: 'BEST_SELLERS',
      is_prime: 'true',
      four_stars_and_up: 'true'
    });

    // Add optional price filters if they exist
    if (typeof min === 'number') searchParams.append('min_price', min.toString());
    if (typeof max === 'number') searchParams.append('max_price', max.toString());

    const searchUrl = `https://${RAPIDAPI_HOST}/search?${searchParams.toString()}`;
    console.log('Search URL:', searchUrl);

    const response = await fetch(searchUrl, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    });

    if (!response.ok) {
      console.error('Amazon API error:', {
        status: response.status,
        statusText: response.statusText
      });
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Amazon API error: ${response.status}`);
    }

    const searchData = await response.json();
    console.log('Search response received');

    if (!searchData.data?.products?.[0]) {
      console.log('No products found in response');
      throw new Error('No products found');
    }

    // Extract data from search results
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