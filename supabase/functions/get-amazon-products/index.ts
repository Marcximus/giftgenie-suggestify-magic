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

const isGiftAppropriate = (product: any): boolean => {
  if (!product || typeof product !== 'object') {
    console.log('Invalid product object:', product);
    return false;
  }

  const title = product.title || '';
  const description = product.product_description || '';

  if (!title) {
    console.log('Product missing title:', product);
    return false;
  }

  const lowerTitle = title.toLowerCase();
  const lowerDesc = description.toLowerCase();
  
  const isAppropriate = !EXCLUDED_KEYWORDS.some(keyword => 
    lowerTitle.includes(keyword) || lowerDesc.includes(keyword));

  if (!isAppropriate) {
    console.log('Product filtered out by keywords:', { title, keywords: EXCLUDED_KEYWORDS });
  }

  return isAppropriate;
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
): Promise<AmazonProduct | null> {
  console.log('Starting Amazon search with term:', searchTerm);
  
  if (!searchTerm?.trim()) {
    console.error('Invalid search term:', searchTerm);
    throw new Error('Search term is required');
  }
  
  const searchParams = new URLSearchParams({
    query: searchTerm.trim(),
    country: 'US',
    category_id: 'aps',
    sort_by: 'RELEVANCE'
  });

  try {
    const searchUrl = `https://${RAPIDAPI_HOST}/search?${searchParams.toString()}`;
    console.log('Making request to:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, {
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
      throw new Error(`API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Search API response products count:', searchData.data?.products?.length || 0);

    if (!searchData.data?.products?.length) {
      console.log('No products found in search results');
      return null;
    }

    // Find first gift-appropriate product
    const giftProduct = searchData.data.products.find((p: any) => 
      p?.asin && isGiftAppropriate(p)
    );

    if (!giftProduct) {
      console.log('No gift-appropriate products found');
      return null;
    }

    console.log('Found appropriate product:', {
      title: giftProduct.title,
      asin: giftProduct.asin
    });

    // Get detailed product information
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
      console.log('Product details fetched successfully for ASIN:', giftProduct.asin);
    } else {
      console.error('Failed to get product details:', detailsResponse.status);
    }

    const price = detailsData?.data?.product_price 
      ? extractPrice(detailsData.data.product_price)
      : extractPrice(giftProduct.product_price);

    const result: AmazonProduct = {
      title: detailsData?.data?.product_title || giftProduct.title || 'Product Title Not Available',
      description: detailsData?.data?.product_description || giftProduct.product_description || giftProduct.title || 'No description available',
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
      hasPrice: result.price !== undefined
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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm } = await req.json();
    
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
      console.error('RAPIDAPI_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const product = await searchAmazonProduct(searchTerm, apiKey);
    
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