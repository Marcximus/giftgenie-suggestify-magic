import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { GiftSuggestion } from '../_shared/types.ts';
import { isRateLimited, logRequest, RATE_LIMIT } from '../_shared/rate-limiter.ts';
import { generateGiftSuggestions } from '../_shared/openai.ts';
import { processGiftSuggestion } from '../_shared/product-processor.ts';
import { buildGiftPrompt } from '../_shared/prompt-builder.ts';
import { filterProducts } from '../_shared/product-filter.ts';
import { analyzePrompt } from '../_shared/prompt-analyzer.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!Deno.env.get('OPENAI_API_KEY')) {
      throw new Error('OpenAI API key not configured');
    }

    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid prompt',
          details: 'Please provide a more specific gift request'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Analyze the prompt first
    const promptAnalysis = analyzePrompt(prompt);
    console.log('Prompt analysis:', promptAnalysis);

    // Default budget range for general queries
    const minBudget = promptAnalysis.budget.min || 50;
    const maxBudget = promptAnalysis.budget.max || 200;

    const enhancedPrompt = buildGiftPrompt(prompt, {
      hasEverything: prompt.toLowerCase().includes('has everything') || prompt.toLowerCase().includes('owns everything'),
      isMale: promptAnalysis.gender === 'male',
      isFemale: promptAnalysis.gender === 'female',
      minBudget,
      maxBudget,
      ageCategory: promptAnalysis.ageCategory
    });

    if (isRateLimited()) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: RATE_LIMIT.RETRY_AFTER
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': RATE_LIMIT.RETRY_AFTER.toString()
          }
        }
      );
    }

    logRequest();

    console.log('Enhanced prompt:', enhancedPrompt);
    const suggestions = await generateGiftSuggestions(enhancedPrompt);
    
    if (!Array.isArray(suggestions)) {
      throw new Error('Invalid suggestions format');
    }

    console.log('Raw suggestions:', suggestions);

    const productPromises = suggestions.map((suggestion, index) => 
      new Promise<GiftSuggestion>(async (resolve) => {
        await new Promise(r => setTimeout(r, index * 1000));
        const product = await processGiftSuggestion(suggestion);
        resolve(product);
      })
    );

    const products = await Promise.all(productPromises);
    console.log('Processed products:', products);

    const filteredProducts = filterProducts(products, minBudget, maxBudget);
    console.log('Filtered products:', filteredProducts);

    return new Response(
      JSON.stringify({ suggestions: filteredProducts.length > 0 ? filteredProducts : products }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});