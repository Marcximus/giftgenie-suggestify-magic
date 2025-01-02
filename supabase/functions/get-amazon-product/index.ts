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

    // Clean and prepare the search query
    const cleanQuery = searchQuery
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .trim();
    
    if (!cleanQuery) {
      throw new Error('Invalid search query after cleaning');
    }

    // Step 1: Search for the product to get its ASIN
    const encodedQuery = encodeURIComponent(cleanQuery);
    const searchUrl = `https://api.scrapingdog.com/amazon/search?api_key=${SCRAPINGDOG_API_KEY}&q=${encodedQuery}&domain=com&type=product`;
    
    console.log('Making search API request with cleaned query:', cleanQuery);
    
    const searchResponse = await fetch(searchUrl);
    const searchText = await searchResponse.text(); // Get raw response text
    
    console.log('Search API raw response:', searchText);
    
    if (!searchResponse.ok) {
      throw new Error(`Search API failed: ${searchResponse.status} - ${searchText}`);
    }

    let searchResults;
    try {
      searchResults = JSON.parse(searchText);
    } catch (e) {
      console.error('Failed to parse search results:', e);
      throw new Error('Invalid JSON response from search API');
    }

    if (!Array.isArray(searchResults) || searchResults.length === 0) {
      console.log('No products found for query:', cleanQuery);
      throw new Error('No products found in search results');
    }

    // Get ASIN from first result
    const firstProduct = searchResults[0];
    const asin = firstProduct.asin;

    if (!asin) {
      console.error('Search result missing ASIN:', firstProduct);
      throw new Error('No ASIN found in search results');
    }

    console.log('Found ASIN:', asin);

    // Step 2: Use the ASIN to get detailed product information
    const productUrl = `https://api.scrapingdog.com/amazon/product?api_key=${SCRAPINGDOG_API_KEY}&asin=${asin}&domain=com`;
    
    console.log('Making product API request for ASIN:', asin);
    
    const productResponse = await fetch(productUrl);
    const productText = await productResponse.text(); // Get raw response text
    
    console.log('Product API raw response:', productText);
    
    if (!productResponse.ok) {
      throw new Error(`Product API failed: ${productResponse.status} - ${productText}`);
    }

    let productData;
    try {
      productData = JSON.parse(productText);
    } catch (e) {
      console.error('Failed to parse product data:', e);
      throw new Error('Invalid JSON response from product API');
    }

    // Validate the product data
    if (!productData || typeof productData !== 'object') {
      throw new Error('Invalid product data format');
    }

    // Format the response data with fallbacks
    const formattedData = {
      title: productData.title || searchQuery,
      description: productData.description || productData.feature_bullets?.join('\n') || 'No description available',
      price: productData.price || 'Price not available',
      images: productData.images || [productData.image].filter(Boolean) || [],
      asin: productData.asin || asin,
      url: `https://www.amazon.com/dp/${asin}`
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