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

const formatPrice = (priceData: any): number | undefined => {
  console.log('Raw price data from Amazon API:', {
    priceData,
    type: typeof priceData,
    isNull: priceData === null,
    isUndefined: priceData === undefined
  });

  // If price is already a number, return it
  if (typeof priceData === 'number' && !isNaN(priceData)) {
    console.log('Price is already a valid number:', priceData);
    return priceData;
  }

  // Handle string prices
  if (typeof priceData === 'string') {
    // Remove currency symbols and other non-numeric characters except decimal point
    const cleanPrice = priceData.replace(/[^0-9.]/g, '');
    const numericPrice = parseFloat(cleanPrice);
    
    console.log('Parsed string price:', {
      original: priceData,
      cleaned: cleanPrice,
      parsed: numericPrice,
      isValid: !isNaN(numericPrice)
    });
    
    if (!isNaN(numericPrice)) {
      return numericPrice;
    }
  }

  // Handle object with current_price property
  if (priceData && typeof priceData === 'object') {
    console.log('Price is an object:', priceData);
    
    if ('current_price' in priceData) {
      const currentPrice = formatPrice(priceData.current_price);
      console.log('Extracted current_price:', currentPrice);
      return currentPrice;
    }
    
    if ('price' in priceData) {
      const price = formatPrice(priceData.price);
      console.log('Extracted price property:', price);
      return price;
    }
  }

  console.log('Failed to extract valid price from:', priceData);
  return undefined;
};

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

    console.log('Amazon API response status:', searchResponse.status);

    if (!searchResponse.ok) {
      console.error('Amazon Search API error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText
      });
      throw new Error(`Amazon API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Raw Amazon API response:', {
      hasData: !!searchData.data,
      productsCount: searchData.data?.products?.length || 0,
      firstProduct: searchData.data?.products?.[0] ? {
        title: searchData.data.products[0].title,
        asin: searchData.data.products[0].asin,
        rawPrice: searchData.data.products[0].price,
        priceStructure: searchData.data.products[0].price ? 
          Object.keys(searchData.data.products[0].price) : []
      } : null
    });

    if (!searchData.data?.products?.[0]) {
      console.error('No products found in search results');
      throw new Error('No products found');
    }

    let product = searchData.data.products[0];
    
    if (!product.asin) {
      console.log('First product has no ASIN, searching for product with ASIN...');
      const productWithAsin = searchData.data.products.find((p: any) => p.asin);
      if (!productWithAsin) {
        console.error('No product with ASIN found in results');
        throw new Error('No product with ASIN found');
      }
      product = productWithAsin;
      console.log('Found alternative product with ASIN:', product.asin);
    }

    // Extract and format the price
    const rawPrice = product.price;
    console.log('Raw price data for product:', {
      productTitle: product.title,
      rawPrice,
      priceType: typeof rawPrice,
      priceKeys: rawPrice ? Object.keys(rawPrice) : []
    });

    const formattedPrice = formatPrice(rawPrice);
    console.log('Formatted price result:', {
      raw: rawPrice,
      formatted: formattedPrice,
      isValid: formattedPrice !== undefined
    });

    const result: AmazonProduct = {
      title: product.title,
      description: product.product_description || product.title,
      price: formattedPrice,
      currency: 'USD',
      imageUrl: product.product_photo || product.thumbnail,
      rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
      totalRatings: product.product_num_ratings ? parseInt(product.product_num_ratings, 10) : undefined,
      asin: product.asin,
    };

    console.log('Final processed product:', {
      title: result.title,
      asin: result.asin,
      hasImage: !!result.imageUrl,
      hasPrice: result.price !== undefined,
      price: result.price
    });

    return result;
  } catch (error) {
    console.error('Error searching Amazon:', {
      error: error.message,
      searchTerm,
      stack: error.stack
    });
    throw error;
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
        JSON.stringify({ error: 'No product found' }),
        { 
          status: 404,
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