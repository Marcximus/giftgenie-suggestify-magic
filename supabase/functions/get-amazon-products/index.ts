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

const EXCLUDED_KEYWORDS = [
  'cancel', 'subscription', 'guide', 'manual', 'how to',
  'instruction', 'tutorial', 'handbook', 'textbook'
];

const isGiftAppropriate = (title: string, description: string = ''): boolean => {
  const lowerTitle = title.toLowerCase();
  const lowerDesc = description.toLowerCase();
  
  // Check for excluded keywords
  if (EXCLUDED_KEYWORDS.some(keyword => 
    lowerTitle.includes(keyword) || lowerDesc.includes(keyword))) {
    console.log('Product filtered out due to excluded keywords:', title);
    return false;
  }

  // Check for digital-only products
  if (lowerTitle.includes('kindle') || 
      lowerTitle.includes('ebook') || 
      lowerTitle.includes('digital')) {
    console.log('Product filtered out as digital-only:', title);
    return false;
  }

  return true;
};

const extractPrice = (priceStr: string | null | undefined): number | undefined => {
  if (!priceStr) return undefined;
  const cleanPrice = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleanPrice);
  return isNaN(price) ? undefined : price;
};

async function searchAmazonProduct(
  searchTerm: string,
  apiKey: string,
  priceRange?: string,
  context: string = 'gift'
): Promise<AmazonProduct | null> {
  console.log('Starting Amazon search with term:', searchTerm, { priceRange, context });
  
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

    // Filter and find the first gift-appropriate product
    const giftProduct = searchData.data.products.find((p: any) => 
      p.asin && isGiftAppropriate(p.title, p.product_description)
    );

    if (!giftProduct) {
      console.log('No gift-appropriate products found in results');
      return null;
    }

    // Get detailed product information using ASIN
    const detailsResponse = await fetch(
      `https://${RAPIDAPI_HOST}/product-details?asin=${giftProduct.asin}&country=US`,
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
      : extractPrice(giftProduct.product_price);

    console.log('Final price extraction:', {
      detailsPrice: detailsData?.data?.product_price,
      searchPrice: giftProduct.product_price,
      extractedPrice: price
    });

    const result: AmazonProduct = {
      title: detailsData?.data?.product_title || giftProduct.title,
      description: detailsData?.data?.product_description || giftProduct.product_description || giftProduct.title,
      price: price,
      currency: 'USD',
      imageUrl: detailsData?.data?.product_photo || giftProduct.product_photo || giftProduct.thumbnail,
      rating: detailsData?.data?.product_star_rating ? parseFloat(detailsData.data.product_star_rating) : undefined,
      totalRatings: detailsData?.data?.product_num_ratings ? parseInt(detailsData.data.product_num_ratings, 10) : undefined,
      asin: giftProduct.asin,
    };

    console.log('Final processed product:', {
      title: result.title,
      asin: result.asin,
      hasImage: !!result.imageUrl,
      hasPrice: result.price !== undefined,
      price: result.price,
      isGiftAppropriate: isGiftAppropriate(result.title, result.description)
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
    const { searchTerm, priceRange, context = 'gift' } = await req.json();
    
    console.log('Request payload:', { searchTerm, priceRange, context });

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

    console.log('Processing request:', { searchTerm, priceRange, context });

    const product = await searchAmazonProduct(searchTerm, apiKey, priceRange, context);
    
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