import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map of product categories to verified ASINs
const productASINs: { [key: string]: string } = {
  "headphones": "B0BDHWDR12",  // Apple AirPods Pro (2nd Generation)
  "watch": "B09G9PQKRQ",      // Apple Watch Series 7
  "kindle": "B09SWW583J",     // Kindle Paperwhite
  "speaker": "B07NQQK76Z",    // Echo Dot (4th Gen)
  "camera": "B08DK13HKM",     // Canon EOS M50 Mark II
  "gaming": "B095HZFWP8",     // Nintendo Switch OLED
  "fitness": "B0B4MWCRRV",    // Fitbit Charge 5
  "default": "B0BDHWDR12"     // Default to AirPods Pro as fallback
};

function findBestMatchingASIN(searchQuery: string): string {
  const query = searchQuery.toLowerCase();
  
  if (query.includes("headphone") || query.includes("airpod") || query.includes("earbud")) {
    return productASINs.headphones;
  }
  if (query.includes("watch") || query.includes("smartwatch")) {
    return productASINs.watch;
  }
  if (query.includes("kindle") || query.includes("reader") || query.includes("book")) {
    return productASINs.kindle;
  }
  if (query.includes("speaker") || query.includes("echo") || query.includes("alexa")) {
    return productASINs.speaker;
  }
  if (query.includes("camera") || query.includes("photo")) {
    return productASINs.camera;
  }
  if (query.includes("game") || query.includes("nintendo") || query.includes("switch")) {
    return productASINs.gaming;
  }
  if (query.includes("fitness") || query.includes("tracker") || query.includes("fitbit")) {
    return productASINs.fitness;
  }
  
  return productASINs.default;
}

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

    // Find the best matching ASIN based on the search query
    const asin = findBestMatchingASIN(searchQuery);
    console.log(`Selected ASIN for "${searchQuery}":`, asin);

    // Construct the URL with parameters
    const url = new URL('https://api.scrapingdog.com/amazon');
    url.searchParams.append('api_key', SCRAPINGDOG_API_KEY);
    url.searchParams.append('asin', asin);
    url.searchParams.append('domain', 'com');

    console.log('Making request to ScrapingDog API with URL:', url.toString().replace(SCRAPINGDOG_API_KEY, '[REDACTED]'));

    const response = await fetch(url.toString());
    console.log('ScrapingDog API Response Status:', response.status);

    // Get the response text first for proper error logging
    const responseText = await response.text();
    console.log('Raw ScrapingDog API Response:', responseText);

    if (!response.ok) {
      throw new Error(`ScrapingDog API returned ${response.status}: ${responseText}`);
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
      asin: asin
    };

    console.log('Successfully formatted product data:', {
      title: formattedData.title,
      hasDescription: !!formattedData.description,
      imageCount: formattedData.images?.length
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