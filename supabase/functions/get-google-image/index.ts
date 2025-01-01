import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple in-memory request tracking
const requestTimestamps: number[] = [];
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 90; // Google's free tier limit is 100 per minute, we'll stay under

function isRateLimited(): boolean {
  const now = Date.now();
  // Remove timestamps older than our window
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_WINDOW) {
    requestTimestamps.shift();
  }
  return requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW;
}

function trackRequest() {
  requestTimestamps.push(Date.now());
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If we get a rate limit response from Google, wait and retry
      if (response.status === 429) {
        console.log(`Rate limited by Google API (attempt ${attempt}/${maxRetries})`);
        // Exponential backoff: 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.error(`Attempt ${attempt} failed:`, error);
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Max retries exceeded');
}

// Function to clean and optimize search terms
function optimizeSearchTerm(searchTerm: string): string {
  return searchTerm
    .toLowerCase()
    // Remove special characters but keep spaces
    .replace(/[^\w\s]/g, ' ')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Check our own rate limiting first
    if (isRateLimited()) {
      console.log('Rate limit exceeded for this window');
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          retryAfter: RATE_LIMIT_WINDOW - (Date.now() - requestTimestamps[0])
        }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      );
    }

    const { searchTerm } = await req.json()
    console.log('Original search term:', searchTerm)
    
    if (!searchTerm) {
      throw new Error('Search term is required')
    }

    const API_KEY = Deno.env.get('GOOGLE_SEARCH_API_KEY')
    const SEARCH_ENGINE_ID = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID')

    if (!API_KEY || !SEARCH_ENGINE_ID) {
      console.error('Missing Google Search credentials')
      throw new Error('Google Search credentials not configured')
    }

    // Try different search strategies
    const searchStrategies = [
      `${searchTerm} product photo white background`,
      `${optimizeSearchTerm(searchTerm)} product image`,
      optimizeSearchTerm(searchTerm)
    ];

    let imageUrl = null;
    let lastError = null;

    // Try each search strategy until we find an image
    for (const query of searchStrategies) {
      try {
        console.log('Trying search with query:', query);
        const encodedQuery = encodeURIComponent(query);
        
        const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${SEARCH_ENGINE_ID}&searchType=image&q=${encodedQuery}&num=5&imgSize=LARGE&imgType=photo&safe=active`;
        
        // Track this request
        trackRequest();

        const response = await fetchWithRetry(url, {
          headers: {
            'Accept': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`Google API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Try to find a suitable image from the results
        if (data.items && data.items.length > 0) {
          // Look for an image with white/light background first
          const suitableImage = data.items.find((item: any) => 
            item.link && (
              item.title?.toLowerCase().includes('white background') ||
              item.snippet?.toLowerCase().includes('white background')
            )
          ) || data.items[0]; // Fallback to first image if no white background found

          if (suitableImage?.link) {
            imageUrl = suitableImage.link;
            console.log('Successfully found image:', imageUrl);
            break;
          }
        }
      } catch (error) {
        console.error('Error with search strategy:', query, error);
        lastError = error;
      }
    }

    if (!imageUrl) {
      // If no image was found with any strategy, return a fallback image
      imageUrl = 'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=300&q=80';
      console.log('Using fallback image:', imageUrl);
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache successful responses for 1 hour
        } 
      }
    );

  } catch (error) {
    console.error('Error in get-google-image function:', error);
    
    let status = 500;
    let message = error.message || 'An unexpected error occurred';
    
    if (message.includes('Rate limit')) {
      status = 429;
    }

    return new Response(
      JSON.stringify({ 
        error: message,
        details: error.stack
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status
      }
    );
  }
});
