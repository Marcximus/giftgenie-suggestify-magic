import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

interface AmazonProduct {
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  rating?: number;
  totalRatings?: number;
  asin: string;
}

const extractPrice = (priceStr: string | null | undefined): number | undefined => {
  if (!priceStr) return undefined;
  const cleanPrice = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleanPrice);
  return isNaN(price) ? undefined : price;
};

async function searchAmazonProduct(
  searchTerm: string,
  apiKey: string,
  priceRange?: string
): Promise<AmazonProduct | null> {
  console.log('Starting Amazon search with term:', searchTerm, { priceRange });
  
  // Extract min and max price from priceRange
  let minPrice, maxPrice;
  if (priceRange) {
    const match = priceRange.match(/(\d+)-(\d+)/);
    if (match) {
      minPrice = parseInt(match[1]);
      maxPrice = parseInt(match[2]);
      console.log(`Extracted price range: $${minPrice}-$${maxPrice}`);
    }
  }

  const buildSearchUrl = (term: string) => {
    const params = new URLSearchParams({
      query: term.trim(),
      country: 'US',
      category_id: 'aps',
      sort_by: 'RELEVANCE'
    });

    // Add price range parameters if available
    if (minPrice !== undefined) params.append('min_price', minPrice.toString());
    if (maxPrice !== undefined) params.append('max_price', maxPrice.toString());

    return `https://${RAPIDAPI_HOST}/search?${params.toString()}`;
  };

  try {
    // First attempt with exact search term
    let searchUrl = buildSearchUrl(searchTerm);
    console.log('Making request to Amazon API with URL:', searchUrl);
    
    let searchResponse = await fetch(searchUrl, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    });

    if (!searchResponse.ok) {
      console.error('Amazon Search API error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText
      });
      return null;
    }

    let searchData = await searchResponse.json();
    
    // If no products found, try with simplified search term
    if (!searchData.data?.products?.length) {
      const simplifiedTerm = searchTerm.split(' ').slice(0, 3).join(' ');
      console.log('No products found, trying simplified search:', simplifiedTerm);
      
      searchUrl = buildSearchUrl(simplifiedTerm);
      console.log('Making fallback request with URL:', searchUrl);
      
      searchResponse = await fetch(searchUrl, {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        }
      });

      if (!searchResponse.ok) {
        console.error('Fallback search API error:', {
          status: searchResponse.status,
          statusText: searchResponse.statusText
        });
        return null;
      }

      searchData = await searchResponse.json();
    }

    if (!searchData.data?.products?.length) {
      console.log('No products found in any search results');
      return null;
    }

    let product = searchData.data.products[0];
    
    if (!product.asin) {
      console.log('First product has no ASIN, searching for product with ASIN...');
      const productWithAsin = searchData.data.products.find((p: any) => p.asin);
      if (!productWithAsin) {
        console.log('No product with ASIN found in results');
        return null;
      }
      product = productWithAsin;
      console.log('Found alternative product with ASIN:', product.asin);
    }

    // Get detailed product information
    const detailsResponse = await fetch(
      `https://${RAPIDAPI_HOST}/product-details?asin=${product.asin}&country=US`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        }
      }
    );

    let detailsData;
    if (detailsResponse.ok) {
      detailsData = await detailsResponse.json();
      console.log('Product details response:', {
        title: detailsData.data?.product_title,
        price: detailsData.data?.product_price,
        originalPrice: detailsData.data?.product_original_price
      });
    }

    const price = detailsData?.data?.product_price 
      ? extractPrice(detailsData.data.product_price)
      : extractPrice(product.product_price);

    // Verify price is within range if price range was specified
    if (price !== undefined && minPrice !== undefined && maxPrice !== undefined) {
      if (price < minPrice || price > maxPrice) {
        console.log(`Product price $${price} outside range $${minPrice}-$${maxPrice}`);
        return null;
      }
    }

    const result: AmazonProduct = {
      title: detailsData?.data?.product_title || product.title,
      description: detailsData?.data?.product_description || product.product_description || product.title,
      price: price,
      currency: 'USD',
      imageUrl: detailsData?.data?.product_photo || product.product_photo || product.thumbnail,
      rating: detailsData?.data?.product_star_rating ? parseFloat(detailsData.data.product_star_rating) : undefined,
      totalRatings: detailsData?.data?.product_num_ratings ? parseInt(detailsData.data.product_num_ratings, 10) : undefined,
      asin: product.asin,
    };

    console.log('Final processed product:', {
      title: result.title,
      asin: result.asin,
      price: result.price,
      withinRange: price !== undefined && 
        (minPrice === undefined || maxPrice === undefined || 
         (price >= minPrice && price <= maxPrice))
    });

    return result;
  } catch (error) {
    console.error('Error searching Amazon:', {
      error: error.message,
      searchTerm,
      stack: error.stack
    });
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

    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      console.error('RAPIDAPI_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Processing request:', { searchTerm, priceRange });

    const product = await searchAmazonProduct(searchTerm, apiKey, priceRange);
    
    if (!product) {
      console.log('No product found for search term:', searchTerm);
      return new Response(
        JSON.stringify({ product: null }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Successfully found product, returning response');
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