import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateGiftSuggestions } from '../_shared/openai.ts';
import { processGiftSuggestion } from '../_shared/product-processor.ts';
import { GiftSuggestion } from '../_shared/types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  console.log('Received request:', req.method, req.url);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const { prompt } = await req.json();
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      throw new Error('Invalid prompt provided');
    }

    console.log('Processing request with prompt:', prompt);
    const suggestions = await generateGiftSuggestions(prompt);
    
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('No valid suggestions generated');
    }

    console.log('Processing suggestions with Amazon API...');
    const products = await Promise.all(
      suggestions.map((suggestion, index) => 
        new Promise<GiftSuggestion>(async (resolve) => {
          try {
            await new Promise(r => setTimeout(r, index * 1000));
            const product = await processGiftSuggestion(suggestion);
            resolve(product);
          } catch (error) {
            console.error(`Error processing suggestion "${suggestion}":`, error);
            resolve({
              title: suggestion,
              description: suggestion,
              priceRange: 'Price not available',
              reason: 'This item matches your requirements.',
              search_query: prompt,
              status: 'error'
            });
          }
        })
      )
    );

    console.log('Successfully processed all products');
    return new Response(
      JSON.stringify({ suggestions: products }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    );

  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate gift suggestions'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});