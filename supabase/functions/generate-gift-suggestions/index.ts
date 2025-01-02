import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CacheManager } from "./cacheManager.ts";
import { generateSuggestions } from "./openAIClient.ts";
import { validateAndCleanSuggestions } from "./responseValidator.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid prompt provided');
    }

    // Generate cache key from normalized prompt
    const cacheKey = prompt.toLowerCase().trim();

    // Check cache first
    const cachedResponse = CacheManager.getCachedResponse(cacheKey);
    if (cachedResponse) {
      console.log('Returning cached response');
      return new Response(JSON.stringify({ suggestions: cachedResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const priceRangeMatch = prompt.match(/Budget:\s*\$?(\d+-\d+)/i);
    const originalPriceRange = priceRangeMatch ? priceRangeMatch[1] : null;

    const suggestions = await generateSuggestions(prompt, openAIApiKey);
    
    const validatedSuggestions = validateAndCleanSuggestions(
      JSON.stringify(suggestions),
      originalPriceRange
    );

    if (validatedSuggestions.length < 4) {
      throw new Error('Not enough valid suggestions generated');
    }

    const response = { suggestions: validatedSuggestions };
    
    // Cache the successful response
    CacheManager.setCachedResponse(cacheKey, validatedSuggestions);

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-gift-suggestions function:', error);
    
    // Send a more detailed error response
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'An error occurred while processing your request.',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});