import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './config.ts';

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

// Helper to parse price range and return min/max values
const parsePriceRange = (priceRange: string): { min?: number; max?: number } => {
  try {
    if (!priceRange) {
      console.log('No price range provided');
      return {};
    }

    console.log('Parsing price range:', priceRange);
    // Remove currency symbols and clean the string
    const cleanRange = priceRange.replace(/[^0-9\-\.]/g, '');
    
    if (!cleanRange) {
      console.log('No numeric values found in price range');
      return {};
    }

    // Handle single number case
    if (!cleanRange.includes('-')) {
      const price = parseFloat(cleanRange);
      if (!isNaN(price)) {
        console.log('Single price value:', price);
        return { min: Math.max(1, price * 0.8), max: price * 1.2 };
      }
    }

    // Handle range case (e.g., "100-200")
    const [minStr, maxStr] = cleanRange.split('-');
    const min = parseFloat(minStr);
    const max = parseFloat(maxStr);
    
    if (!isNaN(min) && !isNaN(max)) {
      console.log('Price range parsed:', { min, max });
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
    
    if (!searchTerm?.trim()) {
      throw new Error('Search term is required');
    }

    console.log('Processing request:', { searchTerm, priceRange });
    
    // Parse price range to get min/max values
    const { min, max } = parsePriceRange(priceRange);
    console.log('Price constraints:', { min, max });

    // Build search URL with basic parameters
    const searchParams = new URLSearchParams({
      query: searchTerm.trim(),
      country: 'US',
      category_id: 'aps', // All departments
      sort_by: 'RELEVANCE'
    });

    // Add optional price filters if they exist
    if (typeof min === 'number') {
      searchParams.append('min_price', min.toString());
    }
    if (typeof max === 'number') {
      searchParams.append('max_price', max.toString());
    }

    const searchUrl = `https://${RAPIDAPI_HOST}/search?${searchParams.toString()}`;
    console.log('Search URL:', searchUrl);

    const response = await fetch(searchUrl, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Amazon API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Amazon API error: ${response.status}`);
    }

    const searchData = await response.json();
    console.log('Search response received');

    if (!searchData.data?.products?.[0]) {
      console.log('No products found in response');
      throw new Error('No products found');
    }

    // Extract data from first product in search results
    const product = searchData.data.products[0];
    const productData = {
      title: product.title || searchTerm,
      description: product.product_description || product.title || searchTerm,
      price: product.price?.current_price ? parseFloat(product.price.current_price) : 0,
      currency: product.price?.currency || 'USD',
      imageUrl: product.product_photo || product.thumbnail,
      rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
      totalRatings: product.product_num_ratings ? parseInt(product.product_num_ratings, 10) : undefined,
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