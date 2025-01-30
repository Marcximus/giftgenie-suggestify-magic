import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { extractPrice, parsePriceRange, validatePriceInRange } from './priceUtils.ts';

const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

async function searchAmazonProduct(
  searchTerm: string,
  apiKey: string,
  priceRange?: string,
  searchParams?: Record<string, string>
): Promise<AmazonProduct | null> {
  console.log('Starting Amazon search with:', { searchTerm, priceRange, searchParams });
  
  // Parse price range first to ensure we have valid constraints
  const parsedRange = priceRange ? parsePriceRange(priceRange) : null;
  console.log('Parsed price range:', parsedRange);

  // Format price parameters for the API (in dollars with 2 decimal places)
  const params = new URLSearchParams({
    query: searchTerm.trim(),
    country: 'US',
    category_id: 'aps',
    sort_by: 'RELEVANCE',
    ...(searchParams || {})
  });

  if (parsedRange) {
    // Convert to exact decimal values
    const minPrice = parsedRange.min.toFixed(2);
    const maxPrice = parsedRange.max.toFixed(2);
    
    console.log('Adding price constraints:', { minPrice, maxPrice });
    params.append('min_price', minPrice);
    params.append('max_price', maxPrice);
    
    // Log final parameters for debugging
    console.log('Final URL parameters:', Object.fromEntries(params.entries()));
  }

  try {
    console.log('Making request to Amazon API with params:', params.toString());
    
    const searchResponse = await fetch(
      `https://${RAPIDAPI_HOST}/search?${params.toString()}`,
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
    for (const product of searchData.data.products) {
      const price = extractPrice(product.product_price);
      console.log('Checking product:', {
        title: product.title,
        rawPrice: product.product_price,
        extractedPrice: price,
        priceRange: parsedRange
      });

      if (!price) {
        console.log('Skipping product - invalid price:', product.title);
        continue;
      }

      // Strict price validation
      if (parsedRange) {
        const isInRange = validatePriceInRange(price, parsedRange.min, parsedRange.max);
        console.log('Price validation:', {
          price,
          min: parsedRange.min,
          max: parsedRange.max,
          isInRange
        });

        if (!isInRange) {
          console.log('Skipping product - outside price range:', {
            title: product.title,
            price,
            min: parsedRange.min,
            max: parsedRange.max
          });
          continue;
        }
      }

      console.log('Found valid product within price range:', {
        title: product.title,
        price,
        asin: product.asin
      });

      return {
        title: product.title,
        description: product.product_description || product.title,
        price: price,
        currency: 'USD',
        imageUrl: product.product_photo || product.thumbnail,
        rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
        totalRatings: product.product_num_ratings ? parseInt(product.product_num_ratings.toString(), 10) : undefined,
        asin: product.asin,
      };
    }

    console.log('No products found within specified price range');
    return null;
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
    const { searchTerm, priceRange, searchParams } = await req.json();
    
    console.log('Request payload:', { searchTerm, priceRange, searchParams });

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

    const product = await searchAmazonProduct(searchTerm, apiKey, priceRange, searchParams);
    
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