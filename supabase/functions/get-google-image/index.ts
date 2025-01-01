import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple in-memory cache with TTL
const cache = new Map<string, { url: string; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour
const RATE_LIMIT_WINDOW = 2000 // 2 seconds between requests
let lastRequestTime = 0
const requestQueue: (() => Promise<Response>)[] = []
let isProcessingQueue = false

async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      await request();
      // Enforce delay between requests
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_WINDOW));
    }
  }

  isProcessingQueue = false;
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  try {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < RATE_LIMIT_WINDOW) {
      const waitTime = RATE_LIMIT_WINDOW - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    lastRequestTime = Date.now();
    console.log('Making request to Google API...');
    const response = await fetch(url, options);
    
    if (!response.ok) {
      console.error(`Google API error: ${response.status} ${response.statusText}`);
      if (response.status === 429 && retries > 0) {
        const delay = Math.pow(2, 4 - retries) * 1000;
        console.log(`Rate limited, retrying in ${delay}ms. Retries left: ${retries-1}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1);
      }
      throw new Error(`Google API returned status ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    if (retries > 0) {
      const delay = Math.pow(2, 4 - retries) * 1000;
      console.log(`Request failed, retrying in ${delay}ms. Retries left: ${retries-1}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

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
      console.error('Missing Google Search credentials');
      throw new Error('Google Search credentials not configured');
    }

    // Clean up search term and add product-specific terms
    const query = `${searchTerm} product white background`.trim();
    const apiUrl = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&searchType=image&q=${encodeURIComponent(query)}&num=1&imgSize=LARGE&imgType=photo`;
    
    console.log('Queuing request to Google API...');
    
    return await new Promise((resolve) => {
      const makeRequest = async () => {
        try {
          const response = await fetchWithRetry(apiUrl, {
            headers: {
              'Accept': 'application/json',
            }
          });

          const data = await response.json();
          console.log('Google API response received');
          
          const imageUrl = data.items?.[0]?.link;

          if (!imageUrl) {
            console.error('No image found in Google API response');
            throw new Error('No image found');
          }

          // Cache the result
          cache.set(cacheKey, { url: imageUrl, timestamp: Date.now() });

          resolve(new Response(
            JSON.stringify({ imageUrl }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          ));
        } catch (error) {
          console.error('Error in request:', error);
          resolve(new Response(
            JSON.stringify({ 
              error: error.message,
              details: error.toString()
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500
            }
          ));
        }
      };

      requestQueue.push(makeRequest);
      processQueue();
    });
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