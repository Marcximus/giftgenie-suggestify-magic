import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Expanded list of common ASINs for popular gift categories
const categoryASINs = {
  headphones: 'B09G9BVKZ5',    // Sony WF-1000XM4
  smartwatch: 'B09G9PV6MS',    // Apple Watch Series 7
  camera: 'B08DK13HKM',        // Canon EOS R6
  gaming: 'B08FC5L3RG',        // PlayStation 5
  laptop: 'B09G9BL5BB',        // MacBook Pro
  tablet: 'B09G9BVKZ4',        // iPad Pro
  speaker: 'B09G9BL5BC',       // Sonos One
  fitness: 'B09G9BL5BD',       // Fitbit Charge 5
  book: 'B09B8LFKQL',         // Popular book
  kitchen: 'B08GC6PL3D',      // Air fryer
  beauty: 'B08H2JM7FS',       // Skincare set
  toy: 'B08WWRJ3FB',         // Popular toy
  jewelry: 'B08N5T9GFD',      // Jewelry piece
  sports: 'B093BVYPXN',      // Sports equipment
  home: 'B09B8W3R9K',        // Home decor
  outdoor: 'B093BVYPXN',     // Outdoor gear
};

function findBestMatchingASIN(searchQuery: string): string | null {
  const query = searchQuery.toLowerCase();
  
  // Check for exact category matches
  for (const [category, asin] of Object.entries(categoryASINs)) {
    if (query.includes(category)) {
      console.log(`Found matching category ${category} for query: ${query}`);
      return asin;
    }
  }
  
  // Check for partial matches
  for (const [category, asin] of Object.entries(categoryASINs)) {
    const words = category.split(' ');
    if (words.some(word => query.includes(word))) {
      console.log(`Found partial match with category ${category} for query: ${query}`);
      return asin;
    }
  }
  
  return null;
}

async function searchProduct(query: string, apiKey: string): Promise<any> {
  const searchUrl = `https://api.scrapingdog.com/amazon/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&domain=com&type=product`;
  console.log('Making search API request:', searchUrl.replace(apiKey, '[REDACTED]'));
  
  const response = await fetch(searchUrl);
  if (!response.ok) {
    throw new Error(`Search API returned ${response.status}`);
  }
  
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No products found in search results');
  }
  
  return data[0];
}

async function getProductDetails(asin: string, apiKey: string): Promise<any> {
  const productUrl = `https://api.scrapingdog.com/amazon/product?api_key=${apiKey}&asin=${asin}&domain=com`;
  console.log('Making product API request:', productUrl.replace(apiKey, '[REDACTED]'));
  
  const response = await fetch(productUrl);
  if (!response.ok) {
    throw new Error(`Product API returned ${response.status}`);
  }
  
  return await response.json();
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

    let productData;
    
    // First try: Use predefined ASIN if available
    const asin = findBestMatchingASIN(searchQuery);
    if (asin) {
      try {
        console.log('Attempting to fetch product details with ASIN:', asin);
        productData = await getProductDetails(asin, SCRAPINGDOG_API_KEY);
      } catch (error) {
        console.warn('Failed to fetch product with ASIN, falling back to search:', error);
      }
    }

    // Second try: Fall back to search if no ASIN match or ASIN fetch failed
    if (!productData) {
      try {
        console.log('Falling back to product search');
        const searchResult = await searchProduct(searchQuery, SCRAPINGDOG_API_KEY);
        if (searchResult.asin) {
          productData = await getProductDetails(searchResult.asin, SCRAPINGDOG_API_KEY);
        } else {
          productData = searchResult;
        }
      } catch (error) {
        console.error('Search fallback failed:', error);
        throw new Error('Failed to find matching product');
      }
    }

    // Format the response data with fallbacks
    const formattedData = {
      title: productData.title || searchQuery,
      description: productData.description || productData.feature_bullets?.join('\n') || 'No description available',
      price: productData.price || 'Price not available',
      images: productData.images || [productData.image].filter(Boolean) || [],
      asin: productData.asin || asin
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