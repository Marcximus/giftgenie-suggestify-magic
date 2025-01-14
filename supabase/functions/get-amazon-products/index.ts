import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

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
      throw new Error('RAPIDAPI_KEY not configured');
    }

    console.log('Searching Amazon for:', searchTerm);

    // Perform the search
    const searchResponse = await fetch(
      `https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(searchTerm)}&country=US`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        }
      }
    );

    if (!searchResponse.ok) {
      console.error('Amazon Search API error:', searchResponse.status);
      throw new Error(`Amazon API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Search response:', searchData);

    if (!searchData.data?.products?.[0]) {
      console.log('No products found for search term:', searchTerm);
      return new Response(
        JSON.stringify({ error: 'No products found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const product = searchData.data.products[0];
    const asin = product.asin;

    if (!asin) {
      console.warn('Invalid product data: No ASIN found');
      return new Response(
        JSON.stringify({ error: 'Invalid product data' }),
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
      throw new Error(`Product details API error: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();
    console.log('Details response:', detailsData);

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

    console.log('Returning product details:', productDetails);

    return new Response(
      JSON.stringify({ product: productDetails }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-amazon-products function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to fetch product details'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});