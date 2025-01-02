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

    // Using the ScrapingDog Amazon Search API directly
    const searchUrl = `https://api.scrapingdog.com/amazon/search?api_key=${SCRAPINGDOG_API_KEY}&q=${encodeURIComponent(searchQuery)}&domain=com&type=product`;
    console.log('Making API request:', searchUrl.replace(SCRAPINGDOG_API_KEY, '[REDACTED]'));

    const response = await fetch(searchUrl);
    console.log('API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Raw API Response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse API response:', e);
      throw new Error('Invalid JSON response from API');
    }

    if (!Array.isArray(data) || data.length === 0) {
      console.warn('No products found');
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

    // Get the first product from the results
    const product = data[0];
    console.log('Selected product:', product);

    // Format the response data
    const formattedData = {
      title: product.title || searchQuery,
      description: product.description || 'No description available',
      price: product.price || 'Price not available',
      images: [product.image].filter(Boolean) || [],
      asin: product.asin || null
    };

    // Validate the formatted data
    if (!formattedData.title) {
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