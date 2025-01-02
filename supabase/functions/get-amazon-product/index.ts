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
      .slice(0, 5) // Use first 5 words for better matching
      .join(' ');

    // For now, we'll use a selection of popular ASINs based on categories
    // In a production environment, this should be replaced with a proper Amazon Product API search
    const popularAsins = {
      'tech': ['B09G9HD6PD', 'B08F7N4F5Q', 'B0CHX3QBCH'],
      'kitchen': ['B08GC6PL3D', 'B075H1B3J5', 'B08XQMH3Y6'],
      'beauty': ['B00AP877FS', 'B087N4NLQF', 'B0BN6RRYCK'],
      'toys': ['B01MS7YUA7', 'B0BPC8W2GX', 'B0747W15QL'],
      'sports': ['B0BN6M5RB1', 'B07PXGQC1Q', 'B000UVRU6G'],
    };

    // Simple category matching based on keywords
    let category = 'tech'; // default category
    if (cleanSearchQuery.match(/kitchen|cook|food|coffee|bake/)) category = 'kitchen';
    if (cleanSearchQuery.match(/beauty|makeup|skin|hair|cosmetic/)) category = 'beauty';
    if (cleanSearchQuery.match(/toy|game|play|kid|child/)) category = 'toys';
    if (cleanSearchQuery.match(/sport|fitness|exercise|workout/)) category = 'sports';

    // Select a random ASIN from the matching category
    const asins = popularAsins[category];
    const selectedAsin = asins[Math.floor(Math.random() * asins.length)];
    console.log(`Selected ASIN ${selectedAsin} from category ${category}`);

    // Fetch product data using the ASIN
    const url = `https://api.scrapingdog.com/amazon/product?api_key=${API_KEY}&domain=com&asin=${selectedAsin}`;
    
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
      brand: data.brand,
      asin: selectedAsin
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