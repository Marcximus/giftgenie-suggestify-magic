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

const parsePriceRange = (priceRange: string): { min: number; max: number } | null => {
  try {
    // Remove currency symbols and clean up
    const cleanRange = priceRange.replace(/[^0-9\-\.]/g, '');
    
    // Handle hyphen-separated range (e.g., "20-50")
    if (cleanRange.includes('-')) {
      const [min, max] = cleanRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
        return { min, max };
      }
    }
    
    // Handle single number with variance (e.g., "around 30")
    const singlePrice = parseFloat(cleanRange);
    if (!isNaN(singlePrice) && singlePrice > 0) {
      return {
        min: Math.floor(singlePrice * 0.8),
        max: Math.ceil(singlePrice * 1.2)
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing price range:', error);
    return null;
  }
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

  // Add price range parameters if provided
  if (priceRange) {
    const parsedRange = parsePriceRange(priceRange);
    if (parsedRange) {
      console.log('Adding price constraints:', parsedRange);
      searchParams.append('min_price', parsedRange.min.toString());
      searchParams.append('max_price', parsedRange.max.toString());
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

    // Extract price from product
    const price = extractPrice(product.product_price);

    // Validate price against range if provided
    if (priceRange && price) {
      const parsedRange = parsePriceRange(priceRange);
      if (parsedRange && (price < parsedRange.min || price > parsedRange.max)) {
        console.log('Product filtered out - price out of range:', {
          price,
          range: parsedRange
        });
        return null;
      }
    }

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