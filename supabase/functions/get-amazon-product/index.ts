import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchQuery } = await req.json();
    console.log('Processing search query:', searchQuery);

    if (!searchQuery) {
      throw new Error('Search query is required');
    }

    const SCRAPINGDOG_API_KEY = Deno.env.get('SCRAPINGDOG_API_KEY');
    if (!SCRAPINGDOG_API_KEY) {
      throw new Error('ScrapingDog API key not configured');
    }

    // First, search for products to get ASIN
    const searchUrl = `https://api.scrapingdog.com/amazon/search?api_key=${SCRAPINGDOG_API_KEY}&q=${encodeURIComponent(searchQuery)}&domain=com&type=product`;
    console.log('Making search API request:', searchUrl.replace(SCRAPINGDOG_API_KEY, '[REDACTED]'));
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      console.error('Search API error:', searchResponse.status, await searchResponse.text());
      throw new Error(`Search API returned ${searchResponse.status}`);
    }

    const searchResults = await searchResponse.json();
    console.log('Search results:', searchResults);

    if (!Array.isArray(searchResults) || searchResults.length === 0) {
      throw new Error('No products found in search results');
    }

    // Get ASIN from first result
    const firstProduct = searchResults[0];
    const asin = firstProduct.asin;

    if (!asin) {
      throw new Error('No ASIN found in search results');
    }

    // Now fetch detailed product information using the ASIN
    const productUrl = `https://api.scrapingdog.com/amazon/product?api_key=${SCRAPINGDOG_API_KEY}&asin=${asin}&domain=com`;
    console.log('Making product API request:', productUrl.replace(SCRAPINGDOG_API_KEY, '[REDACTED]'));
    
    const productResponse = await fetch(productUrl);
    if (!productResponse.ok) {
      console.error('Product API error:', productResponse.status, await productResponse.text());
      throw new Error(`Product API returned ${productResponse.status}`);
    }

    const productData = await productResponse.json();
    console.log('Product data received:', {
      title: productData.title,
      hasDescription: !!productData.description,
      hasImages: !!productData.images?.length,
      asin: productData.asin
    });

    // Format the response data with fallbacks
    const formattedData = {
      title: productData.title || searchQuery,
      description: productData.description || productData.feature_bullets?.join('\n') || 'No description available',
      price: productData.price || 'Price not available',
      images: productData.images || [productData.image].filter(Boolean) || [],
      asin: productData.asin || asin
    };

    return new Response(
      JSON.stringify(formattedData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600'
        } 
      }
    );

  } catch (error) {
    console.error('Error in get-amazon-product function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to fetch Amazon product data'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});