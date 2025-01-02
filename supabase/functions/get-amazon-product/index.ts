import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Common ASINs for popular product categories
const categoryASINs = {
  headphones: 'B09G9BVKZ5', // Example: Sony WF-1000XM4
  smartwatch: 'B09G9PV6MS', // Example: Apple Watch Series 7
  camera: 'B08DK13HKM',    // Example: Canon EOS R6
  gaming: 'B08FC5L3RG',    // Example: PlayStation 5
  laptop: 'B09G9BL5BB',    // Example: MacBook Pro
  tablet: 'B09G9BVKZ4',    // Example: iPad Pro
  speaker: 'B09G9BL5BC',   // Example: Sonos One
  fitness: 'B09G9BL5BD',   // Example: Fitbit Charge 5
};

function findBestMatchingASIN(searchQuery: string): string | null {
  const query = searchQuery.toLowerCase();
  
  // Check for category matches
  for (const [category, asin] of Object.entries(categoryASINs)) {
    if (query.includes(category)) {
      console.log(`Found matching category ${category} for query: ${query}`);
      return asin;
    }
  }
  
  // Default to a popular product in the category if no specific match
  return null;
}

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

    // Find a matching ASIN for the search query
    const asin = findBestMatchingASIN(searchQuery);
    if (!asin) {
      console.log('No matching ASIN found for query:', searchQuery);
      throw new Error('No matching product found');
    }

    // Using the ScrapingDog Product Details API
    const productUrl = `https://api.scrapingdog.com/amazon/product?api_key=${SCRAPINGDOG_API_KEY}&asin=${asin}&domain=com`;
    console.log('Making API request:', productUrl.replace(SCRAPINGDOG_API_KEY, '[REDACTED]'));

    const response = await fetch(productUrl);
    console.log('API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw API Response:', JSON.stringify(data));

    if (!data || !data.title) {
      console.warn('Invalid product data received');
      throw new Error('Invalid product data received from API');
    }

    // Format the response data
    const formattedData = {
      title: data.title || searchQuery,
      description: data.description || data.feature_bullets?.join('\n') || 'No description available',
      price: data.price || 'Price not available',
      images: data.images || [],
      asin: data.asin || asin
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