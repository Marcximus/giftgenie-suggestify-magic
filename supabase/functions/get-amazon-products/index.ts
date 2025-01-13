import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { searchAmazonProduct } from "./amazonApi.ts";
import { isRateLimited, logRequest, RATE_LIMIT } from "../_shared/rate-limiter.ts";
import { cleanSearchTerm, simplifySearchTerm } from './utils/textUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Queue to manage requests
const requestQueue: Array<() => Promise<void>> = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      await request();
      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  isProcessing = false;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    const { searchTerm } = await req.json();
    console.log('Received request for:', searchTerm);

    if (!searchTerm) {
      throw new Error('Search term is required');
    }

    // Check rate limiting
    if (isRateLimited()) {
      const retryAfter = RATE_LIMIT.RETRY_AFTER;
      console.log(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
      
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter,
          message: 'Too many requests, please try again later'
        }),
        { 
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }

    // Add request to queue
    return await new Promise((resolve) => {
      const processRequest = async () => {
        try {
          // Log the request for rate limiting
          logRequest();

          // Try different search variations
          const searchAttempts = [
            searchTerm,
            cleanSearchTerm(searchTerm),
            simplifySearchTerm(searchTerm),
            // Try with first three words
            searchTerm.split(' ').slice(0, 3).join(' '),
            // Try with just the main keyword
            searchTerm.split(' ')[0]
          ];

          let product = null;
          let lastError = null;

          for (const attempt of searchAttempts) {
            if (!attempt || attempt.length < 3) continue;
            
            console.log('Attempting search with term:', attempt);
            try {
              product = await searchAmazonProduct(attempt, apiKey);
              if (product) {
                console.log('Found product with search term:', attempt);
                break;
              }
            } catch (error) {
              console.log('Search attempt failed:', error);
              lastError = error;
              // Only continue if it's not a rate limit error
              if (error.message?.includes('Rate limit')) {
                throw error;
              }
              // Wait before next attempt
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }

          if (product) {
            resolve(new Response(
              JSON.stringify(product),
              { 
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json',
                },
              },
            ));
          } else {
            resolve(new Response(
              JSON.stringify({ 
                error: 'Product not found',
                message: 'No matching products found'
              }),
              { 
                status: 404,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json',
                },
              }
            ));
          }
        } catch (error) {
          console.error('Error processing request:', error);
          
          // Handle rate limit errors from Amazon API
          if (error.message?.includes('Rate limit exceeded')) {
            const retryAfter = parseInt(error.message.match(/\d+/)?.[0] || '30', 10);
            resolve(new Response(
              JSON.stringify({
                error: 'Rate limit exceeded',
                retryAfter,
                message: 'Amazon API rate limit reached'
              }),
              { 
                status: 429,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json',
                  'Retry-After': retryAfter.toString(),
                },
              }
            ));
            return;
          }
          
          resolve(new Response(
            JSON.stringify({
              error: error.message,
              details: error.stack,
            }),
            { 
              status: error.status || 500,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            },
          ));
        }
      };

      requestQueue.push(processRequest);
      processQueue();
    });

  } catch (error) {
    console.error('Error in get-amazon-products function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
      }),
      { 
        status: error.status || 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});