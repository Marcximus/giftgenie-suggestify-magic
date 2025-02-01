import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { searchProducts } from './productSearch.ts';

const RATE_LIMIT = {
  WINDOW_MS: 60000, // 1 minute
  MAX_REQUESTS: 25,
  RETRY_AFTER: 30 // seconds
};

const requestLog: { timestamp: number }[] = [];

const isRateLimited = () => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.WINDOW_MS;
  // Clean up old requests
  while (requestLog.length > 0 && requestLog[0].timestamp < windowStart) {
    requestLog.shift();
  }
  return requestLog.length >= RATE_LIMIT.MAX_REQUESTS;
};

const logRequest = () => {
  requestLog.push({ timestamp: Date.now() });
};

const extractPriceRange = (priceRange: string): { min: number; max: number } | null => {
  console.log('Extracting price range from:', priceRange);
  
  try {
    // Handle "around X" format
    const aroundMatch = priceRange.match(/around\s*\$?\s*(\d+)/i);
    if (aroundMatch) {
      const basePrice = parseInt(aroundMatch[1]);
      return {
        min: Math.floor(basePrice * 0.8),
        max: Math.ceil(basePrice * 1.2)
      };
    }

    // Handle range format (e.g., "$20-30" or "20-30")
    const rangeMatch = priceRange.match(/\$?(\d+)\s*-\s*\$?(\d+)/);
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1]);
      const max = parseInt(rangeMatch[2]);
      // Apply 20% margin
      return {
        min: Math.floor(min * 0.8),
        max: Math.ceil(max * 1.2)
      };
    }

    // Handle single number
    const numberMatch = priceRange.match(/\$?(\d+)/);
    if (numberMatch) {
      const price = parseInt(numberMatch[1]);
      return {
        min: Math.floor(price * 0.8),
        max: Math.ceil(price * 1.2)
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing price range:', error);
    return null;
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request:', req.method);
    const { searchTerm, priceRange: rawPriceRange } = await req.json();
    
    console.log('Request payload:', { searchTerm, priceRange: rawPriceRange });

    if (!searchTerm) {
      console.error('Missing search term in request');
      return new Response(
        JSON.stringify({ error: 'Search term is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check rate limiting
    if (isRateLimited()) {
      console.log('Rate limit exceeded, waiting...');
      const retryAfter = RATE_LIMIT.RETRY_AFTER;
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString()
          }
        }
      );
    }

    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      console.error('RAPIDAPI_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract and validate price range with 20% margin
    let priceConstraints = null;
    if (rawPriceRange) {
      priceConstraints = extractPriceRange(rawPriceRange);
      console.log('Extracted price constraints:', priceConstraints);
    }

    // Log request
    logRequest();

    // Search for products with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    let product = null;

    while (retryCount < maxRetries && !product) {
      try {
        product = await searchProducts(searchTerm, apiKey, priceConstraints);
        
        if (!product && retryCount < maxRetries - 1) {
          console.log(`Attempt ${retryCount + 1} failed, retrying...`);
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          retryCount++;
        }
      } catch (error) {
        console.error(`Error in attempt ${retryCount + 1}:`, error);
        if (error.status === 429) {
          // Handle rate limiting
          const retryAfter = parseInt(error.headers?.get('retry-after') || '30');
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        }
        retryCount++;
      }
    }

    if (!product) {
      console.log('No products found after all attempts');
      return new Response(
        JSON.stringify({ product: null }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Successfully found product:', product);
    return new Response(
      JSON.stringify({ product }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing request:', {
      error: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.stack
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});