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

    // First, search for the ASIN using a search query
    // For now, we'll use a mock ASIN for testing
    // TODO: Implement actual ASIN search
    const mockAsin = 'B00AP877FS';

    // Fetch product data using the ASIN
    const url = `https://api.scrapingdog.com/amazon/product?api_key=${API_KEY}&domain=com&asin=${mockAsin}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ScrapingDog API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Successfully fetched Amazon product data:', {
      title: data.title,
      price: data.price,
      imageCount: data.images?.length
    });

    // Format the response data
    const formattedData = {
      title: data.title,
      description: data.description || data.feature_bullets?.join('\n'),
      price: data.price,
      images: data.images || [],
      rating: data.average_rating,
      reviews: data.total_reviews,
      availability: data.availability_status,
      features: data.feature_bullets,
      category: data.product_category,
      brand: data.brand
    };

    return new Response(
      JSON.stringify(formattedData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache successful responses for 1 hour
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