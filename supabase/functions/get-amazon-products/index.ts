import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AmazonSearchResult {
  data: {
    products: Array<{
      asin: string;
      title: string;
    }>;
  };
}

interface AmazonProductDetails {
  data: {
    title: string;
    description?: string;
    product_information?: string[] | string;
    feature_bullets?: string[];
    price: {
      current_price: number;
      currency: string;
    };
    rating?: number;
    ratings_total?: number;
    main_image?: string;
    asin: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RAPIDAPI_KEY) {
      throw new Error('RapidAPI key not configured');
    }

    const { searchTerm } = await req.json();
    console.log('Searching Amazon for:', searchTerm);

    // Step 1: Search for products using the exact title from ChatGPT
    const searchUrl = `https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(searchTerm)}&country=US`;
    console.log('Search URL:', searchUrl);

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    if (!searchResponse.ok) {
      throw new Error(`Amazon search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json() as AmazonSearchResult;
    console.log('Search results:', searchData);

    // Get the first product's ASIN
    const firstProduct = searchData.data?.products?.[0];
    if (!firstProduct?.asin) {
      throw new Error('No products found');
    }

    console.log('Found product ASIN:', firstProduct.asin);

    // Step 2: Get detailed product information using the ASIN
    const detailsResponse = await fetch(`https://${RAPIDAPI_HOST}/product-details?asin=${firstProduct.asin}&country=US`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    if (!detailsResponse.ok) {
      throw new Error(`Product details failed: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json() as AmazonProductDetails;
    console.log('Product details received for ASIN:', firstProduct.asin);

    const product = detailsData.data;
    
    // Handle product information which might be a string or array
    let description = '';
    if (product.description) {
      description = product.description;
    } else {
      const featureBullets = Array.isArray(product.feature_bullets) ? product.feature_bullets.join(' ') : '';
      const productInfo = Array.isArray(product.product_information) 
        ? product.product_information.join(' ')
        : typeof product.product_information === 'string' 
          ? product.product_information 
          : '';
      
      description = featureBullets || productInfo || 'No description available';
    }

    // Construct the direct Amazon product URL using the ASIN
    const amazonUrl = `https://www.amazon.com/dp/${product.asin}`;
    
    return new Response(
      JSON.stringify({
        title: product.title,
        description: description,
        price: product.price?.current_price || 0,
        currency: product.price?.currency || 'USD',
        imageUrl: product.main_image,
        rating: product.rating,
        totalRatings: product.ratings_total,
        asin: product.asin,
        amazonUrl: amazonUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in get-amazon-products function:', error);
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