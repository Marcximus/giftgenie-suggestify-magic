import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { searchProducts } from "./productSearch.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { isRateLimited, logRequest } from '../_shared/rate-limiter.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    if (isRateLimited()) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    logRequest();

    if (!RAPIDAPI_KEY) {
      console.error('RAPIDAPI_KEY is not configured');
      throw new Error('RAPIDAPI_KEY is not configured');
    }

    // Input validation
    const RequestSchema = z.object({
      searchTerm: z.string().trim().min(1, 'Search term required').max(200, 'Search term too long'),
      priceRange: z.union([
        z.string(),
        z.object({
          min: z.number(),
          max: z.number()
        })
      ]).optional()
    });

    const body = await req.json();
    const validated = RequestSchema.parse(body);
    console.log('Validated request:', validated);

    const { searchTerm, priceRange } = validated;
    
    console.log('Processing request:', { searchTerm, priceRange });

    const product = await searchProducts(searchTerm, RAPIDAPI_KEY, priceRange);
    
    console.log('Search result:', {
      found: !!product,
      productTitle: product?.title,
      hasPrice: !!product?.price,
      hasImage: !!product?.imageUrl
    });

    return new Response(
      JSON.stringify({ 
        product,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in get-amazon-products:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});