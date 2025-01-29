import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { extractPrice, parsePriceRange, validatePriceInRange } from './priceUtils.ts';

const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

async function searchAmazonProduct(
  searchTerm: string,
  apiKey: string,
  priceRange?: string
): Promise<AmazonProduct | null> {
  console.log('Starting Amazon search with term:', searchTerm, { priceRange });
  
  const searchParams = new URLSearchParams({
    query: searchTerm.trim(),
    country: 'US',
    category_id: 'aps',
    sort_by: 'RELEVANCE'
  });

  // Add price range parameters if provided
  if (priceRange) {
    const parsedRange = parsePriceRange(priceRange);
    if (parsedRange) {
      console.log('Adding price constraints:', parsedRange);
      // Add a 10% buffer to the range to account for price fluctuations
      searchParams.append('min_price', Math.floor(parsedRange.min * 0.9).toString());
      searchParams.append('max_price', Math.ceil(parsedRange.max * 1.1).toString());
    }
  }

  try {
    console.log('Making request to Amazon API with params:', searchParams.toString());
    
    const searchResponse = await fetch(
      `https://${RAPIDAPI_HOST}/search?${searchParams.toString()}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        }
      }
    );

    if (!searchResponse.ok) {
      console.error('Amazon Search API error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText
      });
      return null;
    }

    const searchData = await searchResponse.json();
    console.log('Raw Amazon API response:', {
      hasData: !!searchData.data,
      productsCount: searchData.data?.products?.length || 0
    });

    if (!searchData.data?.products?.length) {
      console.log('No products found in search results');
      return null;
    }

    // Find the first product that matches our price criteria
    const validProduct = searchData.data.products.find((product: any) => {
      const price = extractPrice(product.product_price);
      if (!price) return false;

      if (priceRange) {
        const parsedRange = parsePriceRange(priceRange);
        if (parsedRange) {
          // Strict price validation - must be within exact range
          return validatePriceInRange(price, parsedRange.min, parsedRange.max);
        }
      }
      return true;
    });

    if (!validProduct) {
      console.log('No products found within price range');
      return null;
    }

    const price = extractPrice(validProduct.product_price);
    
    return {
      title: validProduct.title,
      description: validProduct.product_description || validProduct.title,
      price: price,
      currency: 'USD',
      imageUrl: validProduct.product_photo || validProduct.thumbnail,
      rating: validProduct.product_star_rating ? parseFloat(validProduct.product_star_rating) : undefined,
      totalRatings: validProduct.product_num_ratings ? parseInt(validProduct.product_num_ratings.toString(), 10) : undefined,
      asin: validProduct.asin,
    };
  } catch (error) {
    console.error('Error searching Amazon:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    const { searchTerm, priceRange } = await req.json();
    
    console.log('Request payload:', { searchTerm, priceRange });

    if (!searchTerm) {
      return new Response(
        JSON.stringify({ error: 'Search term is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const product = await searchAmazonProduct(searchTerm, apiKey, priceRange);
    
    return new Response(
      JSON.stringify({ product }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
