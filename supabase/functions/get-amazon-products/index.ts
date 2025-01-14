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
    const { searchTerm } = await req.json();
    const apiKey = Deno.env.get('RAPIDAPI_KEY');

    // Validate required inputs
    if (!apiKey) {
      console.error('RAPIDAPI_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'API configuration error',
          details: 'RapidAPI key is not configured'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
      console.error('Invalid or missing search term:', searchTerm);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request',
          details: 'Search term is required and must be a non-empty string'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Searching Amazon for:', searchTerm);

    // Clean and encode search term
    const cleanSearchTerm = searchTerm
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&#x27;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();

    // Create URL with proper encoding
    const url = new URL(`https://${RAPIDAPI_HOST}/search`);
    url.searchParams.append('query', cleanSearchTerm);
    url.searchParams.append('country', 'US');

    console.log('Making request to:', url.toString());

    // Perform the search
    const searchResponse = await fetch(url, {
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
      
      if (searchResponse.status === 403) {
        return new Response(
          JSON.stringify({
            error: 'API subscription error',
            details: 'Please check the RapidAPI subscription status'
          }),
          { 
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      throw new Error(`Amazon API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Search response received:', {
      hasData: !!searchData.data,
      productsCount: searchData.data?.products?.length || 0
    });

    if (!searchData.data?.products?.[0]) {
      console.log('No products found for search term:', searchTerm);
      return new Response(
        JSON.stringify({ 
          error: 'No products found',
          details: 'No matching products found for the search term'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    let product = searchData.data.products[0];
    
    // Ensure we have an ASIN
    if (!product.asin) {
      // If no ASIN found in first result, try next products
      const productWithAsin = searchData.data.products.find(p => p.asin);
      if (!productWithAsin) {
        console.error('No product with ASIN found');
        return new Response(
          JSON.stringify({ 
            error: 'Invalid product data',
            details: 'No valid product identifier found'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }
      product = productWithAsin;
    }

    const asin = product.asin;

    // Get detailed product information
    const detailsUrl = new URL(`https://${RAPIDAPI_HOST}/product-details`);
    detailsUrl.searchParams.append('asin', asin);
    detailsUrl.searchParams.append('country', 'US');

    console.log('Fetching details for ASIN:', asin);
    const detailsResponse = await fetch(detailsUrl, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      }
    });

    let detailsData;
    try {
      if (detailsResponse.ok) {
        detailsData = await detailsResponse.json();
        console.log('Details response received for ASIN:', asin);
      } else {
        console.warn('Failed to get product details, falling back to search data');
      }
    } catch (error) {
      console.error('Error parsing details response:', error);
      // Continue with search data if details parsing fails
    }

    // Format price
    const formatPrice = (priceStr: string | null | undefined): number | undefined => {
      if (!priceStr) return undefined;
      const cleanPrice = priceStr.replace(/[^0-9.]/g, '');
      const price = parseFloat(cleanPrice);
      return isNaN(price) ? undefined : price;
    };

    // Combine search and details data, preferring details when available
    const productDetails: AmazonProduct = {
      title: detailsData?.data?.product_title || product.title,
      description: detailsData?.data?.product_description || product.product_description || product.title,
      price: formatPrice(detailsData?.data?.product_price || product.product_price),
      currency: detailsData?.data?.currency || 'USD',
      imageUrl: detailsData?.data?.product_photos?.[0] || product.product_photo || product.thumbnail,
      rating: detailsData?.data?.product_star_rating ? 
        parseFloat(detailsData.data.product_star_rating) : 
        product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
      totalRatings: detailsData?.data?.product_num_ratings ? 
        parseInt(detailsData.data.product_num_ratings.toString(), 10) : 
        product.product_num_ratings ? parseInt(product.product_num_ratings.toString(), 10) : undefined,
      asin: asin
    };

    // Validate required fields
    if (!productDetails.title || !productDetails.asin) {
      console.error('Invalid product details:', productDetails);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid product details',
          details: 'Missing required product information'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Returning product details:', {
      title: productDetails.title,
      asin: productDetails.asin,
      hasPrice: !!productDetails.price,
      hasImage: !!productDetails.imageUrl
    });

    return new Response(
      JSON.stringify({ product: productDetails }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-amazon-products function:', error);
    console.error('Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch product details',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});