import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple in-memory cache with TTL
const cache = new Map<string, { url: string; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour
let lastRequestTime = 0
const RATE_LIMIT_WINDOW = 1000 // 1 second between requests

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm } = await req.json();
    console.log('Searching Google Images for:', searchTerm);
    
    if (!searchTerm) {
      throw new Error('Search term is required');
    }

    // Check cache first
    const cacheKey = searchTerm.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached result for:', searchTerm);
      return new Response(
        JSON.stringify({ imageUrl: cached.url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const API_KEY = Deno.env.get('GOOGLE_SEARCH_API_KEY');
    const SEARCH_ENGINE_ID = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');

    if (!API_KEY || !SEARCH_ENGINE_ID) {
      throw new Error('Google Search credentials not configured');
    }

    // Enforce rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_WINDOW) {
      const waitTime = RATE_LIMIT_WINDOW - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();

    // Clean up search term and add product-specific terms
    const query = `${searchTerm} product white background`.trim();
    const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&searchType=image&q=${encodeURIComponent(query)}&num=1&imgSize=LARGE&imgType=photo`;

    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit reached',
            details: 'Please try again in a moment'
          }),
          { 
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      throw new Error(`Google API returned status ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.items?.[0]?.link;

    if (!imageUrl) {
      throw new Error('No image found');
    }

    // Cache the result
    cache.set(cacheKey, { url: imageUrl, timestamp: Date.now() });

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-google-image function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});