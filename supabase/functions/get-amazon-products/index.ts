import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { searchWithFallback } from './searchUtils.ts';

const RAPIDAPI_HOST = 'real-time-amazon-data.p.rapidapi.com';

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm, priceRange } = await req.json();
    const apiKey = Deno.env.get('RAPIDAPI_KEY');

    if (!apiKey) {
      console.error('RAPIDAPI_KEY not configured');
      throw new Error('RAPIDAPI_KEY not configured');
    }

    if (!searchTerm) {
      console.error('No search term provided');
      throw new Error('Search term is required');
    }

    console.log('Starting Amazon search for:', searchTerm);

    // Perform the search with fallback
    const searchData = await searchWithFallback(searchTerm, apiKey, RAPIDAPI_HOST);
    console.log('Search response received:', {
      hasData: !!searchData?.data,
      productsCount: searchData?.data?.products?.length
    });

    if (!searchData?.data?.products?.[0]) {
      console.log('No products found for search term:', searchTerm);
      return new Response(
        JSON.stringify({ 
          error: 'No products found',
          searchTerm 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const product = searchData.data.products[0];
    const asin = product.asin;

    if (!asin) {
      console.warn('Invalid product data: No ASIN found');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid product data',
          details: 'No ASIN found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get detailed product information
    console.log('Getting details for ASIN:', asin);
    const detailsResponse = await fetch(
      `https://${RAPIDAPI_HOST}/product-details?asin=${asin}&country=US`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        }
      }
    );

    if (!detailsResponse.ok) {
      console.error('Product details API error:', detailsResponse.status);
      throw new Error(`Product details API error: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();
    console.log('Details response received:', {
      hasData: !!detailsData?.data,
      title: detailsData?.data?.product_title?.substring(0, 50)
    });

    // Extract and format product details
    const formatPrice = (priceStr: string | null | undefined): number | undefined => {
      if (!priceStr) return undefined;
      const cleanPrice = priceStr.replace(/[^0-9.]/g, '');
      const price = parseFloat(cleanPrice);
      return isNaN(price) ? undefined : price;
    };

    const productDetails: AmazonProduct = {
      title: detailsData.data?.product_title || product.title,
      description: detailsData.data?.product_description || product.product_description,
      price: formatPrice(detailsData.data?.product_price || product.product_price),
      currency: detailsData.data?.currency || 'USD',
      imageUrl: detailsData.data?.product_photos?.[0] || product.product_photo || product.thumbnail,
      rating: detailsData.data?.product_star_rating ? 
        parseFloat(detailsData.data.product_star_rating) : 
        product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
      totalRatings: detailsData.data?.product_num_ratings ? 
        parseInt(detailsData.data.product_num_ratings.toString(), 10) : 
        product.product_num_ratings ? parseInt(product.product_num_ratings.toString(), 10) : undefined,
      asin: asin
    };

    // Validate required fields
    if (!productDetails.title || !productDetails.asin) {
      console.error('Invalid product details:', productDetails);
      throw new Error('Invalid product details');
    }

    console.log('Returning product details:', {
      title: productDetails.title.substring(0, 50),
      asin: productDetails.asin
    });

    return new Response(
      JSON.stringify({ product: productDetails }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-amazon-products function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        details: 'Failed to fetch product details',
        timestamp: new Date().toISOString()
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});