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

    // Step 1: Search for the product
    const searchUrl = `https://api.scrapingdog.com/amazon/search?api_key=${SCRAPINGDOG_API_KEY}&q=${encodeURIComponent(searchQuery)}&domain=com`;
    console.log('Making search request:', searchUrl.replace(SCRAPINGDOG_API_KEY, '[REDACTED]'));

    const searchResponse = await fetch(searchUrl);
    console.log('Search API Response Status:', searchResponse.status);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Search API Error:', errorText);
      throw new Error(`Search API returned ${searchResponse.status}: ${errorText}`);
    }

    const searchText = await searchResponse.text();
    console.log('Raw Search API Response:', searchText);

    let searchData;
    try {
      searchData = JSON.parse(searchText);
    } catch (e) {
      console.error('Failed to parse search response:', e);
      throw new Error('Invalid JSON from search API');
    }

    if (!Array.isArray(searchData) || searchData.length === 0) {
      console.warn('No products found in search');
      return new Response(
        JSON.stringify({ 
          error: 'No products found',
          searchQuery 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Get the first product's ASIN
    const firstProduct = searchData[0];
    if (!firstProduct.asin) {
      console.error('No ASIN in first product:', firstProduct);
      throw new Error('No ASIN found in search result');
    }

    console.log(`Found ASIN for "${searchQuery}":`, firstProduct.asin);

    // Step 2: Get detailed product information
    const productUrl = `https://api.scrapingdog.com/amazon?api_key=${SCRAPINGDOG_API_KEY}&asin=${firstProduct.asin}&domain=com`;
    console.log('Fetching product details:', productUrl.replace(SCRAPINGDOG_API_KEY, '[REDACTED]'));

    const productResponse = await fetch(productUrl);
    console.log('Product API Response Status:', productResponse.status);

    if (!productResponse.ok) {
      const errorText = await productResponse.text();
      console.error('Product API Error:', errorText);
      throw new Error(`Product API returned ${productResponse.status}: ${errorText}`);
    }

    const productText = await productResponse.text();
    console.log('Raw Product API Response:', productText);

    let productData;
    try {
      productData = JSON.parse(productText);
    } catch (e) {
      console.error('Failed to parse product response:', e, 'Raw response:', productText);
      throw new Error('Invalid JSON from product API');
    }

    if (!productData || typeof productData !== 'object') {
      console.error('Invalid product data structure:', productData);
      throw new Error('Invalid product data structure');
    }

    // Format and validate the response data
    const formattedData = {
      title: productData.title || firstProduct.title || searchQuery,
      description: productData.description || productData.feature_bullets?.join(' ') || firstProduct.description || 'No description available',
      price: productData.price || firstProduct.price || 'Price not available',
      images: productData.images || [firstProduct.image].filter(Boolean) || [],
      asin: firstProduct.asin
    };

    // Validate the formatted data
    if (!formattedData.title || !formattedData.asin) {
      console.error('Invalid formatted data:', formattedData);
      throw new Error('Failed to format product data');
    }

    console.log('Successfully formatted product data:', {
      title: formattedData.title,
      hasDescription: !!formattedData.description,
      imageCount: formattedData.images?.length,
      asin: formattedData.asin
    });

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