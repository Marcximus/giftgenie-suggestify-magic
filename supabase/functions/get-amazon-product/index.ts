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

    const API_KEY = Deno.env.get('SCRAPINGDOG_API_KEY');
    if (!API_KEY) {
      throw new Error('ScrapingDog API key not configured');
    }

    // Clean up the search query to improve matching
    const cleanSearchQuery = searchQuery
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 5)
      .join(' ');

    // Use a single, verified ASIN for testing
    const testAsin = 'B08F7N4F5Q'; // Apple AirPods Pro
    console.log(`Using test ASIN: ${testAsin}`);

    // Log full request details for debugging
    const baseUrl = 'https://api.scrapingdog.com/amazon/product';
    const params = {
      api_key: API_KEY,
      asin: testAsin,
      domain: 'com'
    };

    // Log the full URL we're about to request (masking the API key)
    const debugParams = { ...params, api_key: params.api_key.substring(0, 5) + '...' };
    console.log('Request parameters:', JSON.stringify(debugParams, null, 2));

    // Make the request using URLSearchParams
    const queryString = new URLSearchParams(params).toString();
    const url = `${baseUrl}?${queryString}`;
    
    console.log('Making request to ScrapingDog API...');
    const response = await fetch(url);
    console.log('Response status:', response.status);

    // Get the response text first for proper error logging
    const responseText = await response.text();
    console.log('Raw response:', responseText);

    if (!response.ok) {
      throw new Error(`ScrapingDog API error: ${response.status} - ${responseText}`);
    }

    // Parse the response text as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      throw new Error('Invalid JSON response from ScrapingDog API');
    }

    if (!data) {
      throw new Error('Empty response from ScrapingDog API');
    }

    // Format the response data
    const formattedData = {
      title: data.title || 'Product title not available',
      description: data.description || data.feature_bullets?.join(' ') || 'No description available',
      price: data.price || 'Price not available',
      images: data.images || [],
      asin: testAsin
    };

    console.log('Successfully formatted product data:', {
      title: formattedData.title,
      hasDescription: !!formattedData.description,
      imageCount: formattedData.images.length
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