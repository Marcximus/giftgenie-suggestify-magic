import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { validateAndCleanSuggestions } from '../_shared/suggestion-validator.ts';
import { processSuggestionsInBatches } from '../_shared/batch-processor.ts';

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');

// Extract price range from the prompt
const extractPriceRange = (prompt: string) => {
  const budgetMatch = prompt.match(/budget(?:\s*of)?\s*\$?(\d+)(?:\s*-\s*\$?(\d+))?/i) ||
                     prompt.match(/\$(\d+)(?:\s*-\s*\$?(\d+))?/);
  
  if (budgetMatch) {
    const min = parseInt(budgetMatch[1]);
    const max = budgetMatch[2] ? parseInt(budgetMatch[2]) : min;
    console.log('Extracted price range:', { min, max });
    return { min, max };
  }
  
  return null;
};

serve(async (req) => {
  const startTime = performance.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { prompt } = await req.json();
    console.log('Processing request with prompt:', prompt);

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      throw new Error('Invalid prompt');
    }

    // Extract price range from prompt
    const priceRange = extractPriceRange(prompt);
    console.log('Extracted price range:', priceRange);

    const enhancedPrompt = `You are a gifting expert. Based on the request: "${prompt}", suggest EXACTLY 8 great gift ideas.

CRITICAL REQUIREMENTS:
1. Return EXACTLY 8 suggestions - no more, no less
2. Consider age, gender, interests and occasion mentioned
3. Titles should be short and precise like "Apple Airpods 2", "Luxury Scented Candles" etc
4. Return ONLY a JSON array containing EXACTLY 8 strings
${priceRange ? `5. IMPORTANT: All suggestions must fit within the budget of $${priceRange.min}${priceRange.max !== priceRange.min ? ` to $${priceRange.max}` : ''}` : ''}`;

    console.log('Enhanced prompt:', enhancedPrompt);

    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a gift suggestion expert. You MUST always return EXACTLY 8 suggestions."
          },
          { role: "user", content: enhancedPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', errorText);
      throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw DeepSeek response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    const suggestions = validateAndCleanSuggestions(data.choices[0].message.content);
    console.log('Validated suggestions:', suggestions);
    
    if (!suggestions || suggestions.length !== 8) {
      throw new Error(`Invalid number of suggestions: ${suggestions?.length ?? 0}. Expected exactly 8 suggestions.`);
    }

    // Process suggestions with retries and price range
    let retryCount = 0;
    const maxRetries = 2;
    let processedProducts = [];

    while (retryCount <= maxRetries && processedProducts.length < 8) {
      console.log(`Processing attempt ${retryCount + 1} of ${maxRetries + 1}`);
      
      const currentBatchProducts = await processSuggestionsInBatches(
        suggestions.slice(processedProducts.length),
        priceRange
      );
      
      console.log(`Found ${currentBatchProducts.length} products in attempt ${retryCount + 1}`);
      processedProducts = [...processedProducts, ...currentBatchProducts];
      
      if (processedProducts.length >= 8) break;
      retryCount++;
    }

    if (!processedProducts.length) {
      console.error('No products found after all retries');
      throw new Error('No products found for suggestions');
    }

    // Log metrics
    await supabase.from('api_metrics').insert({
      endpoint: 'generate-gift-suggestions',
      duration_ms: Math.round(performance.now() - startTime),
      status: 'success',
      cache_hit: false
    });

    return new Response(
      JSON.stringify({ suggestions: processedProducts.slice(0, 8) }),
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
    console.error('Stack trace:', error.stack);
    
    // Log error metrics
    await supabase.from('api_metrics').insert({
      endpoint: 'generate-gift-suggestions',
      duration_ms: Math.round(performance.now() - startTime),
      status: 'error',
      error_message: error.message,
      cache_hit: false
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate gift suggestions',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
      }
    );
  }
});