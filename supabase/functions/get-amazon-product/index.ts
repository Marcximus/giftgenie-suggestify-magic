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
    console.log('Searching for Amazon product:', searchQuery);

    if (!searchQuery) {
      throw new Error('Search query is required');
    }

    const SCRAPINGDOG_API_KEY = Deno.env.get('SCRAPINGDOG_API_KEY');
    if (!SCRAPINGDOG_API_KEY) {
      throw new Error('ScrapingDog API key not configured');
    }

    // First, search for the product to get its ASIN
    const searchUrl = new URL('https://api.scrapingdog.com/amazon/search');
    searchUrl.searchParams.append('api_key', SCRAPINGDOG_API_KEY);
    searchUrl.searchParams.append('q', searchQuery);
    searchUrl.searchParams.append('domain', 'com');

    console.log('Making search request to ScrapingDog API:', searchUrl.toString().replace(SCRAPINGDOG_API_KEY, '[REDACTED]'));

    const searchResponse = await fetch(searchUrl.toString());
    console.log('Search API Response Status:', searchResponse.status);

    const searchText = await searchResponse.text();
    console.log('Raw Search API Response:', searchText);

    if (!searchResponse.ok) {
      throw new Error(`ScrapingDog Search API returned ${searchResponse.status}: ${searchText}`);
    }

    let searchData;
    try {
      searchData = JSON.parse(searchText);
    } catch (e) {
      console.error('Failed to parse search response as JSON:', e);
      throw new Error('Invalid JSON response from ScrapingDog Search API');
    }

    if (!searchData || !Array.isArray(searchData) || searchData.length === 0) {
      throw new Error('No products found in search results');
    }

    // Get the ASIN of the first search result
    const firstProduct = searchData[0];
    const asin = firstProduct.asin;

    if (!asin) {
      throw new Error('No ASIN found in search result');
    }

    console.log(`Found ASIN for "${searchQuery}":`, asin);

    // Now get the detailed product information using the ASIN
    const productUrl = new URL('https://api.scrapingdog.com/amazon');
    productUrl.searchParams.append('api_key', SCRAPINGDOG_API_KEY);
    productUrl.searchParams.append('asin', asin);
    productUrl.searchParams.append('domain', 'com');

    console.log('Making product request to ScrapingDog API:', productUrl.toString().replace(SCRAPINGDOG_API_KEY, '[REDACTED]'));

    const productResponse = await fetch(productUrl.toString());
    console.log('Product API Response Status:', productResponse.status);

    const productText = await productResponse.text();
    console.log('Raw Product API Response:', productText);

    if (!productResponse.ok) {
      throw new Error(`ScrapingDog Product API returned ${productResponse.status}: ${productText}`);
    }

    let productData;
    try {
      productData = JSON.parse(productText);
    } catch (e) {
      console.error('Failed to parse product response as JSON:', e);
      throw new Error('Invalid JSON response from ScrapingDog Product API');
    }

    if (!productData) {
      throw new Error('Empty response from ScrapingDog Product API');
    }

    // Format the response data
    const formattedData = {
      title: productData.title || 'Product title not available',
      description: productData.description || productData.feature_bullets?.join(' ') || 'No description available',
      price: productData.price || 'Price not available',
      images: productData.images || [],
      asin: asin
    };

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